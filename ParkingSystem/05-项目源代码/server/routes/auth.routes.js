const express = require('express');
const bcrypt = require('bcryptjs');
const { get } = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return fail(res, '用户名和密码不能为空');
    }

    const user = await get(`SELECT id, username, real_name, role, password, status, ban_until, violation_count FROM users WHERE username = ?`, [username]);
    if (!user) {
      return fail(res, '用户名或密码错误', 4001);
    }

    if (user.status === 'disabled') {
      return fail(res, '账号已被禁用', 4002);
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return fail(res, '用户名或密码错误', 4001);
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role
    });

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        violationCount: user.violation_count,
        banUntil: user.ban_until
      }
    }, '登录成功');
  } catch (err) {
    next(err);
  }
});

router.get('/profile', authMiddleware(), async (req, res, next) => {
  try {
    const user = await get(
      `SELECT id, username, real_name, role, violation_count, ban_until FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) {
      return fail(res, '用户不存在', 404, 404);
    }
    success(res, user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
