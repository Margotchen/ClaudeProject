const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'employee.db');
const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');

const db = new DatabaseSync(dbPath);
console.log('SQLite 数据库连接成功');

const sql = fs.readFileSync(sqlPath, 'utf8');
db.exec(sql);
console.log('数据库表结构初始化完成');
db.close();
