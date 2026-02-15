const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, tier: user.tier },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = () => uuidv4();

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

module.exports = { generateAccessToken, generateRefreshToken, sanitizeUser };
