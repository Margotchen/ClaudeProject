require('dotenv').config();
const db = require('../models');
const { initData } = require('./seed-data');

async function initialize() {
  await db.sequelize.sync({ force: true });
  console.log('Database synchronized');
  await initData();
  console.log('Seed data initialized');
}

initialize().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
