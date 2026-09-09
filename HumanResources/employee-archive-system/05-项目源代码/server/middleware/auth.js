const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'employee-archive-secret-key';
const TOKEN_EXPIRES = '24h';

// 生成 JWT
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

// 验证 JWT 中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ code: 401, message: '请先登录' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ code: 403, message: '登录已过期，请重新登录' });
    }
}

module.exports = { generateToken, authenticateToken, JWT_SECRET };
