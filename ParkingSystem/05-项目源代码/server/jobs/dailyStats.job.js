const cron = require('node-cron');
const { run, get, all } = require('../db');
const dayjs = require('../utils/dayjs');

async function calculateDailyStats() {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const areas = await all(`SELECT id FROM parking_areas ORDER BY id`);
  const slots = ['morning', 'afternoon', 'all_day'];

  for (const area of areas) {
    for (const slot of slots) {
      const totalSpots = (await get(
        `SELECT COUNT(*) as total FROM parking_spots WHERE area_id = ?`,
        [area.id]
      )).total;

      const reserved = (await get(
        `SELECT COUNT(*) as total FROM reservations
         WHERE spot_id IN (SELECT id FROM parking_spots WHERE area_id = ?)
           AND reserve_date = ? AND time_slot = ? AND status IN ('reserved', 'checked_in')`,
        [area.id, yesterday, slot]
      )).total;

      const checkedIn = (await get(
        `SELECT COUNT(*) as total FROM reservations
         WHERE spot_id IN (SELECT id FROM parking_spots WHERE area_id = ?)
           AND reserve_date = ? AND time_slot = ? AND status = 'checked_in'`,
        [area.id, yesterday, slot]
      )).total;

      const rate = totalSpots > 0 ? ((reserved / totalSpots) * 100).toFixed(2) : 0;

      await run(
        `INSERT INTO daily_statistics (stat_date, area_id, time_slot, total_spots, reserved_count, checked_in_count, utilization_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(stat_date, area_id, time_slot) DO UPDATE SET
           total_spots = excluded.total_spots,
           reserved_count = excluded.reserved_count,
           checked_in_count = excluded.checked_in_count,
           utilization_rate = excluded.utilization_rate`,
        [yesterday, area.id, slot, totalSpots, reserved, checkedIn, rate]
      );
    }
  }

  console.log(`[scheduler] 已生成 ${yesterday} 每日统计`);
}

function startDailyStatsJob() {
  cron.schedule('30 0 * * *', async () => {
    try {
      await calculateDailyStats();
    } catch (err) {
      console.error('[dailyStatsJob] 执行失败:', err);
    }
  });
}

module.exports = { startDailyStatsJob, calculateDailyStats };
