const express = require('express');
const { run, get, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');

const router = express.Router();

// 获取当前用户的车辆
router.get('/', authMiddleware(), async (req, res, next) => {
  try {
    const list = await all(
      `SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    success(res, list);
  } catch (err) {
    next(err);
  }
});

// 添加车辆
router.post('/', authMiddleware(), async (req, res, next) => {
  try {
    const { plateNumber, carType, color, isDefault } = req.body;
    if (!plateNumber) return fail(res, '车牌号不能为空');

    // 车牌号格式校验（宽松）
    const plateRegex = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]?$/;
    if (!plateRegex.test(plateNumber)) {
      return fail(res, '车牌号格式不正确');
    }

    // 如果是第一辆车，自动设为默认
    const existing = await all(`SELECT id FROM vehicles WHERE user_id = ?`, [req.user.id]);
    const finalIsDefault = existing.length === 0 ? 1 : (isDefault ? 1 : 0);

    if (finalIsDefault) {
      await run(`UPDATE vehicles SET is_default = 0 WHERE user_id = ?`, [req.user.id]);
    }

    const result = await run(
      `INSERT INTO vehicles (user_id, plate_number, car_type, color, is_default) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, plateNumber.toUpperCase(), carType || null, color || null, finalIsDefault]
    );

    await operationLogger(req.user.id, 'vehicle', 'create', { vehicleId: result.id, plateNumber }, req.ip);
    success(res, { id: result.id }, '添加成功');
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return fail(res, '该车牌号已存在');
    }
    next(err);
  }
});

// 更新车辆
router.put('/:id', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { carType, color, isDefault } = req.body;

    const vehicle = await get(`SELECT * FROM vehicles WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!vehicle) return fail(res, '车辆不存在或无权限', 403, 403);

    if (isDefault) {
      await run(`UPDATE vehicles SET is_default = 0 WHERE user_id = ?`, [req.user.id]);
    }

    await run(
      `UPDATE vehicles SET car_type = ?, color = ?, is_default = ? WHERE id = ?`,
      [carType || null, color || null, isDefault ? 1 : 0, id]
    );

    success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

// 删除车辆
router.delete('/:id', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await get(`SELECT * FROM vehicles WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    if (!vehicle) return fail(res, '车辆不存在或无权限', 403, 403);

    // 检查是否有有效预约关联
    const activeReservation = await get(
      `SELECT id FROM reservations WHERE vehicle_id = ? AND status IN ('reserved', 'checked_in')`,
      [id]
    );
    if (activeReservation) return fail(res, '该车辆存在有效预约，无法删除');

    await run(`DELETE FROM vehicles WHERE id = ?`, [id]);
    await operationLogger(req.user.id, 'vehicle', 'delete', { vehicleId: id }, req.ip);
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
