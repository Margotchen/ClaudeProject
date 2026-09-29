require('dotenv').config();
const path = require('path');

module.exports = {
  dialect: 'sqlite',
  dialectModule: require('../utils/sqlite3-wrapper'),
  storage: process.env.DB_STORAGE || path.join(__dirname, '../data/benefit_system.sqlite'),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};
