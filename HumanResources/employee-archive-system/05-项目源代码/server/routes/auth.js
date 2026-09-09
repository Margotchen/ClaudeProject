const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { generateToken, authenticateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// 用户登录
router.post('/login', (req, res) => {
    const db = req.db;
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ code: 401, message: '用户名或密码错误' });
        }

        const token = generateToken({ userId: user.id, username: user.username, role: user.role });
        res.json({
            code: 0,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 用户注册（仅管理员可创建新用户）
router.post('/register', authenticateToken, (req, res) => {
    const db = req.db;
    const { username, password, role = 'admin' } = req.body;

    if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ code: 403, message: '只有管理员可以创建新用户' });
    }

    try {
        const exist = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (exist) {
            return res.status(400).json({ code: 400, message: '用户名已存在' });
        }

        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        const result = db.prepare(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
        ).run(username, passwordHash, role);

        res.json({ code: 0, message: '注册成功', data: { id: result.lastInsertRowid } });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

// 获取当前登录用户信息
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ code: 0, data: req.user });
});

// 修改密码
router.put('/change-password', authenticateToken, (req, res) => {
    const db = req.db;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ code: 400, message: '原密码和新密码不能为空' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
        if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) {
            return res.status(400).json({ code: 400, message: '原密码错误' });
        }

        const newHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.userId);
        res.json({ code: 0, message: '密码修改成功' });
    } catch (err) {
        res.status(500).json({ code: 500, message: err.message });
    }
});

module.exports = router;
