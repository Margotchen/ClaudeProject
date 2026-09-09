const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'benefit_system.sqlite');
const sqlPath = path.join(__dirname, '../migrations/init-database.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

try {
  db.exec(sql);
  console.log('数据库初始化成功:', dbPath);
} catch (err) {
  console.error('数据库初始化失败:', err.message);
  process.exit(1);
} finally {
  db.close();
}
