const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 加载模型
db.SysUser = require('./sysUser.model')(sequelize, DataTypes);
db.SysRole = require('./sysRole.model')(sequelize, DataTypes);
db.GiftInfo = require('./giftInfo.model')(sequelize, DataTypes);
db.WelfareActivity = require('./welfareActivity.model')(sequelize, DataTypes);
db.ActivityGiftRel = require('./activityGiftRel.model')(sequelize, DataTypes);
db.UserAddress = require('./userAddress.model')(sequelize, DataTypes);
db.WelfareApply = require('./welfareApply.model')(sequelize, DataTypes);
db.WelfareApplyItem = require('./welfareApplyItem.model')(sequelize, DataTypes);
db.SysOperateLog = require('./sysOperateLog.model')(sequelize, DataTypes);

// 定义模型关联
const {
  SysUser, SysRole, GiftInfo, WelfareActivity, ActivityGiftRel,
  UserAddress, WelfareApply, WelfareApplyItem, SysOperateLog
} = db;

// 用户 - 角色
SysUser.belongsTo(SysRole, { foreignKey: 'role_id', as: 'role' });
SysRole.hasMany(SysUser, { foreignKey: 'role_id', as: 'users' });

// 用户 - 地址
SysUser.hasMany(UserAddress, { foreignKey: 'user_id', as: 'addresses' });
UserAddress.belongsTo(SysUser, { foreignKey: 'user_id', as: 'user' });

// 活动 - 礼品（多对多）
WelfareActivity.belongsToMany(GiftInfo, {
  through: ActivityGiftRel,
  foreignKey: 'activity_id',
  otherKey: 'gift_id',
  as: 'gifts'
});
GiftInfo.belongsToMany(WelfareActivity, {
  through: ActivityGiftRel,
  foreignKey: 'gift_id',
  otherKey: 'activity_id',
  as: 'activities'
});
ActivityGiftRel.belongsTo(WelfareActivity, { foreignKey: 'activity_id', as: 'activity' });
ActivityGiftRel.belongsTo(GiftInfo, { foreignKey: 'gift_id', as: 'gift' });
WelfareActivity.hasMany(ActivityGiftRel, { foreignKey: 'activity_id', as: 'giftRelations' });
GiftInfo.hasMany(ActivityGiftRel, { foreignKey: 'gift_id', as: 'activityRelations' });

// 申领主表 - 活动/用户
WelfareApply.belongsTo(WelfareActivity, { foreignKey: 'activity_id', as: 'activity' });
WelfareApply.belongsTo(SysUser, { foreignKey: 'user_id', as: 'user' });
WelfareActivity.hasMany(WelfareApply, { foreignKey: 'activity_id', as: 'applies' });
SysUser.hasMany(WelfareApply, { foreignKey: 'user_id', as: 'applies' });

// 申领主表 - 明细
WelfareApply.hasMany(WelfareApplyItem, { foreignKey: 'apply_id', as: 'items' });
WelfareApplyItem.belongsTo(WelfareApply, { foreignKey: 'apply_id', as: 'apply' });
WelfareApplyItem.belongsTo(GiftInfo, { foreignKey: 'gift_id', as: 'gift' });

// 操作日志 - 用户
SysOperateLog.belongsTo(SysUser, { foreignKey: 'user_id', as: 'user' });
SysUser.hasMany(SysOperateLog, { foreignKey: 'user_id', as: 'logs' });

module.exports = db;
