const express = require('express');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');

const router = express.Router();

// 获取用户列表（仅系统管理员）
router.get('/', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { keyword, role, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (keyword) {
      where += ` AND (username LIKE ? OR real_name LIKE ? OR employee_no LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (role) {
      where += ` AND role = ?`;
      params.push(role);
    }

    const countRow = await get(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const list = await all(
      `SELECT u.*, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    success(res, { list, total: countRow.total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

// 创建用户
router.post('/', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { username, password, realName, employeeNo, departmentId, phone, role } = req.body;
    if (!username || !password || !realName) {
      return fail(res, '用户名、密码、姓名为必填项');
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const result = await run(
      `INSERT INTO users (username, password, real_name, employee_no, department_id, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, hash, realName, employeeNo || null, departmentId || null, phone || null, role || 'employee']
    );

    await operationLogger(req.user.id, 'user', 'create', { userId: result.id, username }, req.ip);
    success(res, { id: result.id }, '创建成功');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return fail(res, '用户名或工号已存在');
    }
    next(err);
  }
});

// 更新用户
router.put('/:id', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { realName, employeeNo, departmentId, phone, role, status } = req.body;

    await run(
      `UPDATE users SET real_name = ?, employee_no = ?, department_id = ?, phone = ?, role = ?, status = ?
       WHERE id = ?`,
      [realName, employeeNo || null, departmentId || null, phone || null, role, status, id]
    );

    await operationLogger(req.user.id, 'user', 'update', { userId: id }, req.ip);
    success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 重置密码
router.post('/:id/reset-password', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return fail(res, '新密码不能为空');

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await run(`UPDATE users SET password = ? WHERE id = ?`, [hash, id]);

    await operationLogger(req.user.id, 'user', 'reset_password', { userId: id }, req.ip);
    success(res, null, '密码重置成功');
  } catch (err) {
    next(err);
  }
});

// 解除封禁
router.post('/:id/unban', authMiddleware(['system_admin', 'parking_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await run(`UPDATE users SET ban_until = NULL, violation_count = 0 WHERE id = ?`, [id]);
    await operationLogger(req.user.id, 'user', 'unban', { userId: id }, req.ip);
    success(res, null, '已解除封禁');
  } catch (err) {
    next(err);
  }
});

// 获取部门列表（公开给已登录用户）
router.get('/departments', authMiddleware(), async (req, res, next) => {
  try {
    const list = await all(`SELECT * FROM departments ORDER BY id`);
    success(res, list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
