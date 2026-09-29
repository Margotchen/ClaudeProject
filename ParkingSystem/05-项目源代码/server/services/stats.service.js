const { get, all } = require('../db');
const dayjs = require('../utils/dayjs');

async function getOverview() {
  const totalSpots = (await get(`SELECT COUNT(*) as total FROM parking_spots`)).total;
  const today = dayjs().format('YYYY-MM-DD');

  const todayReservations = (await get(
    `SELECT COUNT(*) as total FROM reservations WHERE reserve_date = ?`,
    [today]
  )).total;

  const todayCheckedIn = (await get(
    `SELECT COUNT(*) as total FROM reservations WHERE reserve_date = ? AND status = 'checked_in'`,
    [today]
  )).total;

  const activeReservations = (await get(
    `SELECT COUNT(*) as total FROM reservations WHERE status IN ('reserved', 'checked_in')`
  )).total;

  const violationCount = (await get(
    `SELECT COUNT(*) as total FROM violation_records WHERE status = 'active' AND created_at >= ?`,
    [dayjs().startOf('month').format('YYYY-MM-DD')]
  )).total;

  // 本周使用率
  const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
  const weekStats = await all(
    `SELECT * FROM daily_statistics WHERE stat_date >= ?`,
    [weekStart]
  );
  const avgRate = weekStats.length > 0
    ? (weekStats.reduce((sum, s) => sum + s.utilization_rate, 0) / weekStats.length).toFixed(2)
    : 0;

  return {
    totalSpots,
    todayReservations,
    todayCheckedIn,
    activeReservations,
    violationCount,
    utilizationRate: avgRate
  };
}

async function getAreaUtilization(date) {
  const targetDate = date || dayjs().format('YYYY-MM-DD');
  const areas = await all(`SELECT id, name, code FROM parking_areas ORDER BY id`);
  const result = [];

  for (const area of areas) {
    const total = (await get(`SELECT COUNT(*) as total FROM parking_spots WHERE area_id = ?`, [area.id])).total;
    const reserved = (await get(
      `SELECT COUNT(*) as total FROM reservations
       WHERE spot_id IN (SELECT id FROM parking_spots WHERE area_id = ?)
         AND reserve_date = ? AND status IN ('reserved', 'checked_in')`,
      [area.id, targetDate]
    )).total;

    result.push({
      area: area.name,
      code: area.code,
      total,
      used: reserved,
      rate: total > 0 ? parseFloat(((reserved / total) * 100).toFixed(2)) : 0
    });
  }

  return result;
}

async function getTimeTrend(days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const morning = (await get(
      `SELECT COUNT(*) as total FROM reservations WHERE reserve_date = ? AND time_slot = 'morning' AND status IN ('reserved', 'checked_in')`,
      [date]
    )).total;
    const afternoon = (await get(
      `SELECT COUNT(*) as total FROM reservations WHERE reserve_date = ? AND time_slot = 'afternoon' AND status IN ('reserved', 'checked_in')`,
      [date]
    )).total;
    const allDay = (await get(
      `SELECT COUNT(*) as total FROM reservations WHERE reserve_date = ? AND time_slot = 'all_day' AND status IN ('reserved', 'checked_in')`,
      [date]
    )).total;

    result.push({
      date,
      morning,
      afternoon,
      allDay
    });
  }
  return result;
}

async function getDetailedStats(date) {
  const targetDate = date || dayjs().format('YYYY-MM-DD');
  const areas = await all(`SELECT id, name FROM parking_areas ORDER BY id`);
  const slots = ['morning', 'afternoon', 'all_day'];
  const result = [];

  for (const area of areas) {
    for (const slot of slots) {
      const total = (await get(`SELECT COUNT(*) as total FROM parking_spots WHERE area_id = ?`, [area.id])).total;
      const used = (await get(
        `SELECT COUNT(*) as total FROM reservations
         WHERE spot_id IN (SELECT id FROM parking_spots WHERE area_id = ?)
           AND reserve_date = ? AND time_slot = ? AND status IN ('reserved', 'checked_in')`,
        [area.id, targetDate, slot]
      )).total;

      result.push({
        date: targetDate,
        area: area.name,
        timeSlot: slot,
        total,
        used,
        rate: total > 0 ? parseFloat(((used / total) * 100).toFixed(2)) : 0
      });
    }
  }

  return result;
}

module.exports = {
  getOverview,
  getAreaUtilization,
  getTimeTrend,
  getDetailedStats
};
