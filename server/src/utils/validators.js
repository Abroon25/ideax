const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const validatePassword = (password) => password && password.length >= 8;
const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);

module.exports = { validateEmail, validatePhone, validatePassword, validateUsername };
