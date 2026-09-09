const { run } = require('../db');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
}

async function operationLogger(userId, module, action, detail, ip) {
  try {
    await run(
      `INSERT INTO operation_logs (user_id, module, action, detail, ip) VALUES (?, ?, ?, ?, ?)`,
      [userId, module, action, JSON.stringify(detail), ip]
    );
  } catch (err) {
    console.error('操作日志记录失败:', err);
  }
}

module.exports = { requestLogger, operationLogger };
