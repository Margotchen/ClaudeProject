const express = require('express');
const { all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success } = require('../utils/response');

const router = express.Router();

// 操作日志列表
router.get('/', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { module, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (module) {
      where += ` AND l.module = ?`;
      params.push(module);
    }

    const list = await all(
      `SELECT l.*, u.username, u.real_name
       FROM operation_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    success(res, { list, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
