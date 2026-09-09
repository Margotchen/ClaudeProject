const express = require('express');
const { run, get, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');
const dayjs = require('../utils/dayjs');

const router = express.Router();

// 获取车位列表
router.get('/', authMiddleware(), async (req, res, next) => {
  try {
    const { areaId, spotType, status, keyword, page = 1, pageSize = 50 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (areaId) {
      where += ` AND s.area_id = ?`;
      params.push(areaId);
    }
    if (spotType) {
      where += ` AND s.spot_type = ?`;
      params.push(spotType);
    }
    if (status) {
      where += ` AND s.status = ?`;
      params.push(status);
    }
    if (keyword) {
      where += ` AND s.spot_code LIKE ?`;
      params.push(`%${keyword}%`);
    }

    const countRow = await get(`SELECT COUNT(*) as total FROM parking_spots s ${where}`, params);
    const list = await all(
      `SELECT s.*, a.name as area_name, a.code as area_code, u.real_name as owner_name
       FROM parking_spots s
       LEFT JOIN parking_areas a ON s.area_id = a.id
       LEFT JOIN users u ON s.owner_id = u.id
       ${where}
       ORDER BY s.area_id, s.spot_code
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
    );

    success(res, { list, total: countRow.total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

// 获取区域列表
router.get('/areas', authMiddleware(), async (req, res, next) => {
  try {
    const list = await all(`SELECT * FROM parking_areas ORDER BY id`);
    success(res, list);
  } catch (err) {
    next(err);
  }
});

// 获取地图状态（含预约占用情况）
router.get('/map-status', authMiddleware(), async (req, res, next) => {
  try {
    const { date, timeSlot = 'all_day' } = req.query;
    const targetDate = date || dayjs().format('YYYY-MM-DD');

    const list = await all(
      `SELECT s.*, a.name as area_name, a.code as area_code,
        CASE WHEN EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.spot_id = s.id
            AND r.reserve_date = ?
            AND r.time_slot = ?
            AND r.status IN ('reserved', 'checked_in')
        ) THEN 'occupied' ELSE s.status END AS real_time_status
       FROM parking_spots s
       LEFT JOIN parking_areas a ON s.area_id = a.id
       ORDER BY s.area_id, s.spot_code`,
      [targetDate, timeSlot]
    );

    success(res, { date: targetDate, timeSlot, list });
  } catch (err) {
    next(err);
  }
});

// 创建车位
router.post('/', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const { spotCode, areaId, spotType, status, ownerId, positionX, positionY } = req.body;
    if (!spotCode || !areaId) return fail(res, '车位编号和区域为必填项');

    const result = await run(
      `INSERT INTO parking_spots (spot_code, area_id, spot_type, status, owner_id, position_x, position_y, qr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [spotCode, areaId, spotType || 'shared', status || 'available', ownerId || null, positionX || 0, positionY || 0, spotCode]
    );

    await operationLogger(req.user.id, 'spot', 'create', { spotId: result.id, spotCode }, req.ip);
    success(res, { id: result.id }, '创建成功');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return fail(res, '车位编号已存在');
    }
    next(err);
  }
});

// 更新车位
router.put('/:id', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { spotCode, areaId, spotType, status, ownerId, positionX, positionY } = req.body;

    await run(
      `UPDATE parking_spots
       SET spot_code = ?, area_id = ?, spot_type = ?, status = ?, owner_id = ?, position_x = ?, position_y = ?
       WHERE id = ?`,
      [spotCode, areaId, spotType, status, ownerId || null, positionX || 0, positionY || 0, id]
    );

    await operationLogger(req.user.id, 'spot', 'update', { spotId: id }, req.ip);
    success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 删除车位
router.delete('/:id', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const activeReservation = await get(
      `SELECT id FROM reservations WHERE spot_id = ? AND status IN ('reserved', 'checked_in')`,
      [id]
    );
    if (activeReservation) return fail(res, '该车位存在有效预约，无法删除');

    await run(`DELETE FROM parking_spots WHERE id = ?`, [id]);
    await operationLogger(req.user.id, 'spot', 'delete', { spotId: id }, req.ip);
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
