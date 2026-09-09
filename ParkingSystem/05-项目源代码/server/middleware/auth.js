const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'parking-system-secret-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未登录或 Token 格式错误', data: null, timestamp: Date.now() });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      req.user = decoded;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ code: 403, message: '权限不足', data: null, timestamp: Date.now() });
      }
      next();
    } catch (err) {
      return res.status(401).json({ code: 401, message: 'Token 无效或已过期', data: null, timestamp: Date.now() });
    }
  };
}

module.exports = { signToken, verifyToken, authMiddleware, JWT_SECRET };
