const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const { response } = require('../utils/response');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(response(401, '未提供访问令牌'));
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json(response(401, '令牌无效或已过期'));
    }
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.roleCode = decoded.roleCode;
    next();
  });
};

module.exports = { verifyToken };
