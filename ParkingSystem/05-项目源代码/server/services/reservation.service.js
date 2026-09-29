const { run, get, all, transaction } = require('../db');
const dayjs = require('../utils/dayjs');
const { generateReservationNo } = require('../utils/codeGenerator');

const TIME_SLOT_CONFIG = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '13:00', end: '18:00' },
  all_day: { start: '08:00', end: '18:00' }
};

function getConfig(key) {
  const row = get(`SELECT config_value FROM system_configs WHERE config_key = ?`, [key]);
  return row ? row.config_value : null;
}

function getSlotStart(timeSlot) {
  return TIME_SLOT_CONFIG[timeSlot]?.start || '08:00';
}

function calculateCheckinDeadline(reserveDate, timeSlot) {
  const startTime = getSlotStart(timeSlot);
  return dayjs(`${reserveDate} ${startTime}`).add(15, 'minute').toISOString();
}

function createReservation({ userId, spotId, vehicleId, reserveDate, timeSlot }) {
  return transaction(({ get, run }) => {
    // 1. 检查用户
    const user = get(`SELECT ban_until, violation_count, role, status FROM users WHERE id = ?`, [userId]);
    if (!user) throw new Error('用户不存在');
    if (user.status === 'disabled') throw new Error('账号已被禁用');
    if (user.ban_until && dayjs(user.ban_until).isAfter(dayjs())) {
      throw new Error('您处于违约封禁期，暂无法预约');
    }

    // 2. 检查车辆
    const vehicle = get(`SELECT * FROM vehicles WHERE id = ? AND user_id = ?`, [vehicleId, userId]);
    if (!vehicle) throw new Error('车辆不存在或不属于当前用户');

    // 3. 检查车位
    const spot = get(`SELECT * FROM parking_spots WHERE id = ?`, [spotId]);
    if (!spot) throw new Error('车位不存在');
    if (spot.status === 'maintenance') throw new Error('该车位正在维护中');
    if (spot.spot_type === 'fixed' && spot.owner_id && spot.owner_id !== userId) {
      throw new Error('固定车位仅所有者或管理员可预约');
    }

    // 4. 时间窗口
    const maxAdvanceDays = user.role === 'employee'
      ? parseInt(getConfig('max_advance_days_employee') || 3)
      : parseInt(getConfig('max_advance_days_admin') || 30);
    const daysDiff = dayjs(reserveDate).diff(dayjs().startOf('day'), 'day');
    if (daysDiff < 0) throw new Error('不能预约过去的日期');
    if (daysDiff > maxAdvanceDays) throw new Error(`最多只能提前${maxAdvanceDays}天预约`);

    // 5. 检查同一用户同一日期同一时段是否已有有效预约
    const existingUserReservation = get(
      `SELECT id FROM reservations
       WHERE user_id = ? AND reserve_date = ? AND time_slot = ?
         AND status IN ('reserved', 'checked_in')`,
      [userId, reserveDate, timeSlot]
    );
    if (existingUserReservation) throw new Error('该时段您已有有效预约');

    // 6. 检查车位是否被占用（依赖事务串行化）
    const existingSpotReservation = get(
      `SELECT id FROM reservations
       WHERE spot_id = ? AND reserve_date = ? AND time_slot = ?
         AND status IN ('reserved', 'checked_in')`,
      [spotId, reserveDate, timeSlot]
    );
    if (existingSpotReservation) throw new Error('该车位已被预约');

    // 7. 创建预约
    const reservationNo = generateReservationNo();
    const checkinDeadline = calculateCheckinDeadline(reserveDate, timeSlot);

    const result = run(
      `INSERT INTO reservations (reservation_no, user_id, spot_id, vehicle_id, reserve_date, time_slot, checkin_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reservationNo, userId, spotId, vehicleId, reserveDate, timeSlot, checkinDeadline]
    );

    return { id: result.id, reservationNo };
  });
}

async function cancelReservation(reservationId, userId, isAdmin = false) {
  const reservation = await get(`SELECT * FROM reservations WHERE id = ?`, [reservationId]);
  if (!reservation) throw new Error('预约不存在');
  if (reservation.user_id !== userId && !isAdmin) throw new Error('无权操作');
  if (!['reserved'].includes(reservation.status)) throw new Error('当前状态不可取消');

  await run(`UPDATE reservations SET status = 'cancelled' WHERE id = ?`, [reservationId]);
  return true;
}

async function checkinReservation(reservationId, { checkinBy, method = 'manual', plateNumber } = {}) {
  const reservation = await get(`SELECT * FROM reservations WHERE id = ?`, [reservationId]);
  if (!reservation) throw new Error('预约不存在');
  if (reservation.status !== 'reserved') throw new Error('预约状态无效');

  const now = dayjs();
  const slotStart = dayjs(`${reservation.reserve_date} ${getSlotStart(reservation.time_slot)}`);
  if (now.isBefore(slotStart.subtract(30, 'minute'))) {
    throw new Error('还未到可核销时间');
  }

  await run(`UPDATE reservations SET status = 'checked_in', checkin_time = CURRENT_TIMESTAMP WHERE id = ?`, [reservationId]);
  await run(
    `INSERT INTO checkin_records (reservation_id, checkin_method, checkin_by, plate_number) VALUES (?, ?, ?, ?)`,
    [reservationId, method, checkinBy || null, plateNumber || null]
  );

  return true;
}

async function checkinByPlate(plateNumber, { checkinBy, method = 'plate' } = {}) {
  const vehicle = await get(`SELECT * FROM vehicles WHERE plate_number = ?`, [plateNumber.toUpperCase()]);
  if (!vehicle) throw new Error('未找到该车牌登记信息');

  const today = dayjs().format('YYYY-MM-DD');
  const reservation = await get(
    `SELECT * FROM reservations
     WHERE user_id = ? AND vehicle_id = ? AND reserve_date = ? AND status = 'reserved'
     ORDER BY created_at DESC LIMIT 1`,
    [vehicle.user_id, vehicle.id, today]
  );

  if (!reservation) throw new Error('未找到该车辆今日有效预约');
  await checkinReservation(reservation.id, { checkinBy, method, plateNumber: plateNumber.toUpperCase() });
  return reservation;
}

async function getMyReservations(userId, { status, page = 1, pageSize = 20 } = {}) {
  let where = 'WHERE r.user_id = ?';
  const params = [userId];
  if (status) {
    where += ` AND r.status = ?`;
    params.push(status);
  }

  const countRow = await get(`SELECT COUNT(*) as total FROM reservations r ${where}`, params);
  const list = await all(
    `SELECT r.*, s.spot_code, a.name as area_name, v.plate_number, v.car_type
     FROM reservations r
     LEFT JOIN parking_spots s ON r.spot_id = s.id
     LEFT JOIN parking_areas a ON s.area_id = a.id
     LEFT JOIN vehicles v ON r.vehicle_id = v.id
     ${where}
     ORDER BY r.reserve_date DESC, r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
  );

  return { list, total: countRow.total, page, pageSize };
}

async function getAllReservations({ keyword, status, date, page = 1, pageSize = 20 } = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  if (keyword) {
    where += ` AND (u.username LIKE ? OR u.real_name LIKE ? OR s.spot_code LIKE ? OR r.reservation_no LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    where += ` AND r.status = ?`;
    params.push(status);
  }
  if (date) {
    where += ` AND r.reserve_date = ?`;
    params.push(date);
  }

  const countRow = await get(
    `SELECT COUNT(*) as total FROM reservations r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN parking_spots s ON r.spot_id = s.id
     ${where}`,
    params
  );
  const list = await all(
    `SELECT r.*, u.username, u.real_name, s.spot_code, a.name as area_name, v.plate_number
     FROM reservations r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN parking_spots s ON r.spot_id = s.id
     LEFT JOIN parking_areas a ON s.area_id = a.id
     LEFT JOIN vehicles v ON r.vehicle_id = v.id
     ${where}
     ORDER BY r.reserve_date DESC, r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize)]
  );

  return { list, total: countRow.total, page, pageSize };
}

module.exports = {
  createReservation,
  cancelReservation,
  checkinReservation,
  checkinByPlate,
  getMyReservations,
  getAllReservations,
  calculateCheckinDeadline,
  getConfig
};
