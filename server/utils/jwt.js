const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'taskflow_dev_secret_key_2026_xyz', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'taskflow_dev_secret_key_2026_xyz');
};

module.exports = { generateToken, verifyToken };
