const cron = require('node-cron');
const { db, run, get, all } = require('../db');
const dayjs = require('../utils/dayjs');
const { operationLogger } = require('../middleware/logger');

let systemUserId = null;

async function getSystemUserId() {
  if (systemUserId) return systemUserId;
  const admin = await get(`SELECT id FROM users WHERE role = 'system_admin' ORDER BY id LIMIT 1`);
  systemUserId = admin?.id || 1;
  return systemUserId;
}

async function processExpiredReservations() {
  const rows = await all(
    `SELECT r.id, r.user_id, r.reservation_no
     FROM reservations r
     WHERE r.status = 'reserved' AND r.checkin_deadline < DATETIME('now')`
  );

  for (const row of rows) {
    await run(`UPDATE reservations SET status = 'violation' WHERE id = ?`, [row.id]);

    await run(
      `INSERT INTO violation_records (user_id, reservation_id, reason) VALUES (?, ?, ?)`,
      [row.user_id, row.id, '超时未核销']
    );

    await run(`UPDATE users SET violation_count = violation_count + 1 WHERE id = ?`, [row.user_id]);

    const user = await get(`SELECT violation_count, username FROM users WHERE id = ?`, [row.user_id]);
    const threshold = parseInt((await get(`SELECT config_value FROM system_configs WHERE config_key = 'violation_threshold'`))?.config_value || 3);
    const banDays = parseInt((await get(`SELECT config_value FROM system_configs WHERE config_key = 'violation_ban_days'`))?.config_value || 7);

    if (user.violation_count >= threshold) {
      const banUntil = dayjs().add(banDays, 'day').toISOString();
      await run(
        `UPDATE users SET ban_until = ?, violation_count = 0 WHERE id = ?`,
        [banUntil, row.user_id]
      );
    }

    const sysId = await getSystemUserId();
    await operationLogger(sysId, 'scheduler', 'violation', {
      reservationId: row.id,
      reservationNo: row.reservation_no,
      userId: row.user_id
    }, '127.0.0.1');
  }

  if (rows.length > 0) {
    console.log(`[scheduler] 处理 ${rows.length} 条超时违约预约`);
  }
}

function startExpireReservationJob() {
  cron.schedule('* * * * *', async () => {
    try {
      await processExpiredReservations();
    } catch (err) {
      console.error('[expireReservationJob] 执行失败:', err);
    }
  });
}

module.exports = { startExpireReservationJob, processExpiredReservations };
