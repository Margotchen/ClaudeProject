const cron = require('node-cron');
const { run, all } = require('../db');
const dayjs = require('../utils/dayjs');

async function releaseSpots() {
  // 将已核销且时段已结束的预约标记为 expired
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const rows = await all(
    `SELECT r.id, r.time_slot, r.reserve_date
     FROM reservations r
     WHERE r.status = 'checked_in'
       AND (
         (r.time_slot = 'morning' AND DATETIME(r.reserve_date || ' 12:00:00') <= DATETIME(?))
         OR (r.time_slot = 'afternoon' AND DATETIME(r.reserve_date || ' 18:00:00') <= DATETIME(?))
         OR (r.time_slot = 'all_day' AND DATETIME(r.reserve_date || ' 18:00:00') <= DATETIME(?))
       )`,
    [now, now, now]
  );

  for (const row of rows) {
    await run(`UPDATE reservations SET status = 'expired' WHERE id = ?`, [row.id]);
  }

  if (rows.length > 0) {
    console.log(`[scheduler] 释放 ${rows.length} 个已结束预约`);
  }
}

function startReleaseSpotJob() {
  cron.schedule('*/30 * * * *', async () => {
    try {
      await releaseSpots();
    } catch (err) {
      console.error('[releaseSpotJob] 执行失败:', err);
    }
  });
}

module.exports = { startReleaseSpotJob, releaseSpots };
