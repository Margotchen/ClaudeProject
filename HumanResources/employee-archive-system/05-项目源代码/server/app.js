const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const dayjs = require('dayjs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 数据库连接
const dbPath = path.join(__dirname, 'database', 'employee.db');
const db = new DatabaseSync(dbPath);
console.log('SQLite 数据库连接成功');

// 初始化数据库
const sqlPath = path.join(__dirname, 'database', 'init.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');
db.exec(sql);
console.log('数据库表结构初始化完成');

// 挂载数据库与 dayjs 到请求
app.use((req, res, next) => {
    req.db = db;
    req.dayjs = dayjs;
    next();
});

const { authenticateToken } = require('./middleware/auth');

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', authenticateToken, require('./routes/employees'));
app.use('/api/contracts', authenticateToken, require('./routes/contracts'));
app.use('/api/reminders', authenticateToken, require('./routes/reminders'));
app.use('/api/stats', authenticateToken, require('./routes/stats'));
app.use('/api/history', authenticateToken, require('./routes/history'));
app.use('/api/export', authenticateToken, require('./routes/export'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
    console.log(`员工档案管理系统后端服务已启动: http://localhost:${PORT}`);
});

module.exports = db;
