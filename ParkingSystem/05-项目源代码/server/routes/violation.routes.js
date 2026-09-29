const express = require('express');
const { run, get, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');

const router = express.Router();

// 违约列表
router.get('/', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (keyword) {
      where += ` AND (u.username LIKE ? OR u.real_name LIKE ? OR r.reservation_no LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      where += ` AND v.status = ?`;
      params.push(status);
    }

    const countRow = await get(`SELECT COUNT(*) as total FROM violation_records v ${where}`, params);
    const list = await all(
      `SELECT v.*, u.username, u.real_name, r.reservation_no, r.reserve_date, r.time_slot,
        p.real_name as pardoned_name
       FROM violation_records v
       LEFT JOIN users u ON v.user_id = u.id
       LEFT JOIN reservations r ON v.reservation_id = r.id
       LEFT JOIN users p ON v.pardoned_by = p.id
       ${where}
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    success(res, { list, total: countRow.total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

// 减免违约
router.post('/:id/pardon', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await get(`SELECT * FROM violation_records WHERE id = ?`, [id]);
    if (!record) return fail(res, '违约记录不存在');
    if (record.status === 'pardoned') return fail(res, '该违约记录已减免');

    await run(
      `UPDATE violation_records SET status = 'pardoned', pardoned_by = ?, pardoned_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.user.id, id]
    );

    // 递减用户违约次数
    await run(
      `UPDATE users SET violation_count = MAX(0, violation_count - 1) WHERE id = ?`,
      [record.user_id]
    );

    await operationLogger(req.user.id, 'violation', 'pardon', { violationId: id, userId: record.user_id }, req.ip);
    success(res, null, '减免成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
