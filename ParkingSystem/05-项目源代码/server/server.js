require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDB } = require('./db/init');
const { requestLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/error');
const { startExpireReservationJob } = require('./jobs/expireReservation.job');
const { startReleaseSpotJob } = require('./jobs/releaseSpot.job');
const { startDailyStatsJob } = require('./jobs/dailyStats.job');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const spotRoutes = require('./routes/spot.routes');
const reservationRoutes = require('./routes/reservation.routes');
const violationRoutes = require('./routes/violation.routes');
const configRoutes = require('./routes/config.routes');
const logRoutes = require('./routes/log.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { time: new Date().toISOString() }, timestamp: Date.now() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/stats', statsRoutes);

// 错误处理
app.use(errorHandler);

// 启动服务
async function start() {
  await initDB();
  startExpireReservationJob();
  startReleaseSpotJob();
  startDailyStatsJob();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('启动失败:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
