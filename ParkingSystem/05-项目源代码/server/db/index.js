const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'parking.db');

const db = new Database(dbPath);

console.log('已连接到 SQLite 数据库:', dbPath);

// better-sqlite3 是同步 API，这里保留 Promise 兼容封装，await 非 Promise 可直接返回值
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { id: result.lastInsertRowid, changes: result.changes };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params) || null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function exec(sql) {
  db.exec(sql);
}

function transaction(fn) {
  const tx = db.transaction((args) => {
    return fn(args);
  });
  return tx({ run, get, all });
}

module.exports = { db, run, get, all, exec, transaction };
