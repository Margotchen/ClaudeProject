const { db, run, get, all, exec } = require('./index');
const bcrypt = require('bcryptjs');

const TABLES_SQL = `
-- 部门表
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  real_name TEXT NOT NULL,
  employee_no TEXT UNIQUE,
  department_id INTEGER,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('employee', 'parking_admin', 'system_admin')),
  violation_count INTEGER DEFAULT 0,
  ban_until DATETIME,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 车辆表
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  car_type TEXT,
  color TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 停车区域表
CREATE TABLE IF NOT EXISTS parking_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  floor INTEGER DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 车位表
CREATE TABLE IF NOT EXISTS parking_spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_code TEXT UNIQUE NOT NULL,
  area_id INTEGER NOT NULL,
  spot_type TEXT NOT NULL DEFAULT 'shared' CHECK(spot_type IN ('fixed', 'shared', 'visitor', 'charging')),
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
  owner_id INTEGER,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (area_id) REFERENCES parking_areas(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预约表
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  spot_id INTEGER NOT NULL,
  vehicle_id INTEGER NOT NULL,
  reserve_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK(time_slot IN ('morning', 'afternoon', 'all_day')),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved', 'checked_in', 'cancelled', 'expired', 'violation')),
  checkin_deadline DATETIME NOT NULL,
  checkin_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (spot_id) REFERENCES parking_spots(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- 核销记录表
CREATE TABLE IF NOT EXISTS checkin_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  checkin_method TEXT NOT NULL CHECK(checkin_method IN ('qrcode', 'plate', 'manual')),
  checkin_by INTEGER,
  plate_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (checkin_by) REFERENCES users(id)
);

-- 违约记录表
CREATE TABLE IF NOT EXISTS violation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reservation_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pardoned')),
  pardoned_by INTEGER,
  pardoned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (pardoned_by) REFERENCES users(id)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 每日统计表
CREATE TABLE IF NOT EXISTS daily_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE NOT NULL,
  area_id INTEGER NOT NULL,
  time_slot TEXT NOT NULL,
  total_spots INTEGER DEFAULT 0,
  reserved_count INTEGER DEFAULT 0,
  checked_in_count INTEGER DEFAULT 0,
  utilization_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stat_date, area_id, time_slot),
  FOREIGN KEY (area_id) REFERENCES parking_areas(id)
);
`;

const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_ban_until ON users(ban_until);

CREATE INDEX IF NOT EXISTS idx_spots_area ON parking_spots(area_id);
CREATE INDEX IF NOT EXISTS idx_spots_type ON parking_spots(spot_type);

CREATE INDEX IF NOT EXISTS idx_reservations_user_date ON reservations(user_id, reserve_date);
CREATE INDEX IF NOT EXISTS idx_reservations_spot_date ON reservations(spot_id, reserve_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_reservations_expire ON reservations(checkin_deadline, status);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_user ON violation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_reservation ON checkin_records(reservation_id);
CREATE INDEX IF NOT EXISTS idx_logs_module ON operation_logs(module, action);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_statistics(stat_date);
`;

const DEFAULT_CONFIGS = [
  ['max_advance_days_employee', '3', '普通员工最多提前预约天数'],
  ['max_advance_days_admin', '30', '管理员最多提前预约天数'],
  ['checkin_grace_minutes', '15', '预约开始后未核销宽限分钟'],
  ['violation_threshold', '3', '违约次数阈值'],
  ['violation_ban_days', '7', '达到阈值后封禁天数']
];

async function initDepartments() {
  const departments = [
    ['研发部', 'RD', '技术研发中心'],
    ['产品部', 'PM', '产品与项目管理'],
    ['市场部', 'MKT', '市场推广'],
    ['人事部', 'HR', '人力资源'],
    ['财务部', 'FIN', '财务中心'],
    ['行政部', 'ADM', '行政后勤'],
    ['销售部', 'SAL', '销售团队']
  ];
  for (const [name, code, desc] of departments) {
    await run(`INSERT OR IGNORE INTO departments (name, code, description) VALUES (?, ?, ?)`, [name, code, desc]);
  }
}

async function initParkingAreas() {
  const areas = [
    ['A区', 'A', 1, '地面停车场A区'],
    ['B区', 'B', 1, '地面停车场B区'],
    ['C区', 'C', -1, '地下停车场C区'],
    ['D区', 'D', -1, '地下停车场D区']
  ];
  for (const [name, code, floor, desc] of areas) {
    await run(`INSERT OR IGNORE INTO parking_areas (name, code, floor, description) VALUES (?, ?, ?, ?)`, [name, code, floor, desc]);
  }
}

async function initParkingSpots() {
  const areas = await all(`SELECT id, code FROM parking_areas ORDER BY id`);
  const types = ['shared', 'shared', 'shared', 'shared', 'visitor', 'charging'];
  const fixedOwners = {};

  let count = 0;
  for (const area of areas) {
    for (let i = 1; i <= 50; i++) {
      const code = `${area.code}${String(i).padStart(3, '0')}`;
      const type = types[Math.floor(Math.random() * types.length)];
      // 每区前 5 个设为固定车位
      const isFixed = i <= 5;
      const finalType = isFixed ? 'fixed' : type;
      const x = (i % 10) * 60 + (areas.indexOf(area) * 220) + 30;
      const y = Math.floor((i - 1) / 10) * 50 + 40;
      const ownerId = isFixed ? null : null; // 固定车位先不绑定具体所有者，由管理员后续分配

      await run(
        `INSERT OR IGNORE INTO parking_spots (spot_code, area_id, spot_type, status, owner_id, position_x, position_y, qr_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, area.id, finalType, 'available', ownerId, x, y, code]
      );
      count++;
    }
  }
  console.log(`已初始化 ${count} 个车位`);
}

async function initDefaultUsers() {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || '123456', salt);

  // 系统管理员
  await run(
    `INSERT OR IGNORE INTO users (username, password, real_name, employee_no, role, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [process.env.ADMIN_USERNAME || 'admin', hash, '系统管理员', 'ADMIN001', 'system_admin', 'active']
  );

  // 车位管理员
  const managerHash = bcrypt.hashSync('123456', salt);
  await run(
    `INSERT OR IGNORE INTO users (username, password, real_name, employee_no, department_id, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['manager', managerHash, '车位管理员', 'MGR001', 6, 'parking_admin', 'active']
  );

  // 普通员工
  const empHash = bcrypt.hashSync('123456', salt);
  await run(
    `INSERT OR IGNORE INTO users (username, password, real_name, employee_no, department_id, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['employee1', empHash, '张三', 'EMP001', 1, 'employee', 'active']
  );

  console.log('默认账号初始化完成');
}

async function initConfigs() {
  for (const [key, value, desc] of DEFAULT_CONFIGS) {
    await run(
      `INSERT OR IGNORE INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)`,
      [key, value, desc]
    );
  }
}

async function initDB() {
  try {
    await exec(TABLES_SQL);
    await exec(INDEXES_SQL);
    await initDepartments();
    await initParkingAreas();
    await initConfigs();
    await initParkingSpots();
    await initDefaultUsers();
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
}

if (require.main === module) {
  initDB().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { initDB };
