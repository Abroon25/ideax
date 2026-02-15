const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, sanitizeUser } = require('../utils/helpers');
const { validateEmail, validatePhone, validatePassword, validateUsername } = require('../utils/validators');
const { sendWelcomeEmail } = require('../services/emailService');

const signup = async (req, res, next) => {
  try {
    const { email, password, phone, username, displayName } = req.body;

    if (!email || !password || !phone || !username || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (!validatePhone(phone)) return res.status(400).json({ error: 'Invalid phone (10 digits, starts 6-9)' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'Password min 8 characters' });
    if (!validateUsername(username)) return res.status(400).json({ error: 'Username: 3-30 chars, alphanumeric/underscore' });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }, { username: username.toLowerCase() }] },
    });
    if (existing) {
      if (existing.email === email) return res.status(409).json({ error: 'Email already registered' });
      if (existing.phone === phone) return res.status(409).json({ error: 'Phone already registered' });
      return res.status(409).json({ error: 'Username taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, phone, username: username.toLowerCase(), displayName, tier: 'FREE' },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({ message: 'Account created', user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ message: 'Login successful', user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) { next(error); }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }, include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(stored.user);
    const newRefresh = generateRefreshToken();
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ message: 'Logged out' });
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userGenres: { include: { genre: true } },
        _count: { select: { ideas: true, followers: true, following: true } },
      },
    });
    res.json({ user: sanitizeUser(user) });
  } catch (error) { next(error); }
};

module.exports = { signup, login, refreshAccessToken, logout, getMe };
