const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');
const reservationService = require('../services/reservation.service');

const router = express.Router();

// 创建预约
router.post('/', authMiddleware(), async (req, res, next) => {
  try {
    const { spotId, vehicleId, reserveDate, timeSlot } = req.body;
    if (!spotId || !vehicleId || !reserveDate || !timeSlot) {
      return fail(res, '车位、车辆、日期、时段为必填项');
    }

    const result = await reservationService.createReservation({
      userId: req.user.id,
      spotId,
      vehicleId,
      reserveDate,
      timeSlot
    });

    await operationLogger(req.user.id, 'reservation', 'create', { reservationId: result.id }, req.ip);
    success(res, result, '预约成功');
  } catch (err) {
    fail(res, err.message);
  }
});

// 我的预约列表
router.get('/my', authMiddleware(), async (req, res, next) => {
  try {
    const data = await reservationService.getMyReservations(req.user.id, req.query);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// 全部预约（管理员）
router.get('/', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const data = await reservationService.getAllReservations(req.query);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// 取消预约
router.post('/:id/cancel', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = ['parking_admin', 'system_admin'].includes(req.user.role);
    await reservationService.cancelReservation(parseInt(id), req.user.id, isAdmin);
    await operationLogger(req.user.id, 'reservation', 'cancel', { reservationId: id }, req.ip);
    success(res, null, '取消成功');
  } catch (err) {
    fail(res, err.message);
  }
});

// 核销预约（ID）
router.post('/:id/checkin', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    await reservationService.checkinReservation(parseInt(id), {
      checkinBy: req.user.id,
      method: req.body.method || 'manual'
    });
    await operationLogger(req.user.id, 'reservation', 'checkin', { reservationId: id }, req.ip);
    success(res, null, '核销成功');
  } catch (err) {
    fail(res, err.message);
  }
});

// 车牌核销
router.post('/checkin-by-plate', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const { plateNumber } = req.body;
    if (!plateNumber) return fail(res, '请输入车牌号');

    const reservation = await reservationService.checkinByPlate(plateNumber, {
      checkinBy: req.user.id,
      method: 'plate'
    });
    await operationLogger(req.user.id, 'reservation', 'checkin_by_plate', { plateNumber, reservationId: reservation.id }, req.ip);
    success(res, { reservationId: reservation.id }, '核销成功');
  } catch (err) {
    fail(res, err.message);
  }
});

module.exports = router;
