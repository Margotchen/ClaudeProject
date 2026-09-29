require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const { run, get, all } = require(path.join(__dirname, '../db'));
const { initDB } = require(path.join(__dirname, '../db/init'));
const dayjs = require(path.join(__dirname, '../utils/dayjs'));

const DEPARTMENT_NAMES = ['研发部', '产品部', '市场部', '人事部', '财务部', '行政部', '销售部'];
const SLOT_WEIGHTS = {
  morning: 0.35,
  afternoon: 0.35,
  all_day: 0.3
};
const TIME_SLOT_CONFIG = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '13:00', end: '18:00' },
  all_day: { start: '08:00', end: '18:00' }
};

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return Object.keys(weights)[0];
}

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateReservationNo(dateStr, index) {
  return `RP${dateStr.replace(/-/g, '')}${String(index).padStart(4, '0')}`;
}

function calculateCheckinDeadline(reserveDate, timeSlot) {
  const startTime = TIME_SLOT_CONFIG[timeSlot].start;
  return dayjs(`${reserveDate} ${startTime}`).add(15, 'minute').toISOString();
}

async function seedDepartments() {
  for (const name of DEPARTMENT_NAMES) {
    await run(`INSERT OR IGNORE INTO departments (name, code) VALUES (?, ?)`, [name, name.replace('部', '')]);
  }
  console.log('部门数据已初始化');
}

async function seedUsers(count = 400) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);
  const deptIds = (await all(`SELECT id FROM departments`)).map(d => d.id);

  const existing = (await get(`SELECT COUNT(*) as total FROM users WHERE role = 'employee'`)).total;
  const need = Math.max(0, count - existing);

  for (let i = 1; i <= need; i++) {
    const idx = existing + i;
    await run(
      `INSERT INTO users (username, password, real_name, employee_no, department_id, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `employee${idx}`,
        hash,
        `员工${idx}`,
        `EMP${String(idx).padStart(4, '0')}`,
        randomItem(deptIds),
        'employee',
        'active'
      ]
    );
  }

  console.log(`已生成 ${count} 名员工`);
}

async function seedVehicles(targetCount = 600) {
  const users = await all(`SELECT id FROM users WHERE role = 'employee' ORDER BY id`);
  const prefixes = ['京', '沪', '津', '渝', '粤', '苏', '浙'];
  const types = ['轿车', 'SUV', 'MPV', '跑车'];
  const colors = ['白色', '黑色', '银色', '红色', '蓝色', '灰色'];

  // 先清空已有预约相关记录及车辆，确保可重复跑批且不破外键约束
  await run(`DELETE FROM violation_records`);
  await run(`DELETE FROM checkin_records`);
  await run(`DELETE FROM reservations`);
  await run(`DELETE FROM vehicles`);
  await run(`UPDATE users SET violation_count = 0, ban_until = NULL WHERE role = 'employee'`);

  let created = 0;

  // 每位员工至少一辆车
  for (const user of users) {
    const plate = `${randomItem(prefixes)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    await run(
      `INSERT INTO vehicles (user_id, plate_number, car_type, color, is_default) VALUES (?, ?, ?, ?, ?)`,
      [user.id, plate, randomItem(types), randomItem(colors), 1]
    );
    created++;
  }

  // 补充车辆至目标数量
  while (created < targetCount) {
    const user = randomItem(users);
    const plate = `${randomItem(prefixes)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    try {
      await run(
        `INSERT INTO vehicles (user_id, plate_number, car_type, color, is_default) VALUES (?, ?, ?, ?, ?)`,
        [user.id, plate, randomItem(types), randomItem(colors), 0]
      );
      created++;
    } catch (err) {
      // 车牌重复则重试
    }
  }

  console.log(`已生成 ${created} 辆车辆`);
}

async function seedReservations(dayRange = 30, violationRate = 0.05) {
  // 清空已有预约及相关记录
  await run(`DELETE FROM reservations`);
  await run(`DELETE FROM checkin_records`);
  await run(`DELETE FROM violation_records`);
  await run(`UPDATE users SET violation_count = 0, ban_until = NULL WHERE role = 'employee'`);

  const users = await all(`SELECT id FROM users WHERE role = 'employee'`);
  const vehicles = await all(`SELECT id, user_id FROM vehicles`);
  const spots = await all(`SELECT id FROM parking_spots WHERE status != 'maintenance'`);

  const userVehicles = {};
  for (const v of vehicles) {
    if (!userVehicles[v.user_id]) userVehicles[v.user_id] = [];
    userVehicles[v.user_id].push(v.id);
  }

  const today = dayjs().format('YYYY-MM-DD');
  let totalCreated = 0;
  let totalCheckedIn = 0;
  let totalViolation = 0;

  for (let d = -dayRange; d < dayRange; d++) {
    const reserveDate = dayjs().add(d, 'day').format('YYYY-MM-DD');
    const isPast = reserveDate < today;
    const isToday = reserveDate === today;

    // 构建所有 (spot, slot) 组合并随机打乱
    const combos = [];
    for (const spot of spots) {
      for (const slot of Object.keys(TIME_SLOT_CONFIG)) {
        combos.push({ spotId: spot.id, timeSlot: slot });
      }
    }
    const shuffled = shuffle(combos);

    // 每天随机生成 100 ~ 220 条有效预约，不超过可用组合数
    const dailyTarget = Math.min(shuffled.length, Math.floor(Math.random() * 121) + 100);
    const usedUserSlots = new Set();
    let seq = 1;

    for (let i = 0; i < shuffled.length && seq <= dailyTarget; i++) {
      const { spotId, timeSlot } = shuffled[i];

      // 为用户随机分配车辆，避免同一用户同日期同时段重复预约
      let user;
      let vehicleId;
      let attempts = 0;
      do {
        user = randomItem(users);
        vehicleId = randomItem(userVehicles[user.id] || []);
        attempts++;
      } while (
        (!vehicleId || usedUserSlots.has(`${user.id}:${timeSlot}`)) &&
        attempts < 50
      );

      if (!vehicleId || usedUserSlots.has(`${user.id}:${timeSlot}`)) continue;

      usedUserSlots.add(`${user.id}:${timeSlot}`);

      const reservationNo = generateReservationNo(reserveDate, seq);
      const checkinDeadline = calculateCheckinDeadline(reserveDate, timeSlot);

      let status = 'reserved';
      let checkinTime = null;

      if (isPast) {
        const rand = Math.random();
        if (rand < violationRate) {
          status = 'violation';
        } else if (rand < 0.75) {
          status = 'checked_in';
          // 在时段开始后 0~60 分钟内核销
          const slotStart = dayjs(`${reserveDate} ${TIME_SLOT_CONFIG[timeSlot].start}`);
          checkinTime = slotStart.add(Math.floor(Math.random() * 60), 'minute').toISOString();
        }
      } else if (isToday && Math.random() < 0.3) {
        status = 'checked_in';
        checkinTime = dayjs().subtract(Math.floor(Math.random() * 120), 'minute').toISOString();
      }

      const result = await run(
        `INSERT INTO reservations (reservation_no, user_id, spot_id, vehicle_id, reserve_date, time_slot, status, checkin_deadline, checkin_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reservationNo, user.id, spotId, vehicleId, reserveDate, timeSlot, status, checkinDeadline, checkinTime]
      );

      totalCreated++;
      seq++;

      if (status === 'checked_in') {
        await run(
          `INSERT INTO checkin_records (reservation_id, checkin_method, checkin_by, plate_number)
           VALUES (?, 'manual', ?, ?)`,
          [result.id, user.id, randomItem(userVehicles[user.id])]
        );
        totalCheckedIn++;
      } else if (status === 'violation') {
        await run(
          `INSERT INTO violation_records (user_id, reservation_id, reason)
           VALUES (?, ?, '超时未核销')`,
          [user.id, result.id]
        );
        await run(`UPDATE users SET violation_count = violation_count + 1 WHERE id = ?`, [user.id]);
        totalViolation++;
      }
    }
  }

  console.log(`已生成 ${totalCreated} 条预约记录（已核销 ${totalCheckedIn}，违约 ${totalViolation}）`);
}

async function runBatch() {
  console.log('开始跑批测试数据生成...');
  await initDB();
  await seedDepartments();
  await seedUsers(400);
  await seedVehicles(600);
  await seedReservations(30, 0.05);

  const stats = await get(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'employee') as employee_count,
      (SELECT COUNT(*) FROM vehicles) as vehicle_count,
      (SELECT COUNT(*) FROM parking_spots) as spot_count,
      (SELECT COUNT(*) FROM reservations) as reservation_count,
      (SELECT COUNT(*) FROM reservations WHERE status = 'violation') as violation_count,
      (SELECT COUNT(*) FROM reservations WHERE status = 'checked_in') as checked_in_count
  `);

  console.log('\n跑批结果统计:');
  console.table(stats);
  process.exit(0);
}

runBatch().catch(err => {
  console.error('跑批失败:', err);
  process.exit(1);
});
