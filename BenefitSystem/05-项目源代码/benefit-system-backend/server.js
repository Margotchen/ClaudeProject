require('dotenv').config();
const app = require('./app');
const db = require('./models');
const activityService = require('./services/activity.service');
const cron = require('node-cron');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // 开发阶段自动同步表结构；生产环境请使用 npm run db:init
    if (process.env.NODE_ENV !== 'production') {
      await db.sequelize.sync();
    }
    console.log('数据库连接成功');

    // 初始化活动状态
    await activityService.refreshActivityStatus();

    // 每分钟刷新一次活动状态
    cron.schedule('* * * * *', () => {
      activityService.refreshActivityStatus().catch(console.error);
    });

    app.listen(PORT, () => {
      console.log(`服务已启动，端口: ${PORT}`);
    });
  } catch (err) {
    console.error('服务启动失败:', err);
    process.exit(1);
  }
}

start();
