const db = require('../models');
const { Op } = require('sequelize');

const WelfareActivity = db.WelfareActivity;

/**
 * 刷新所有活动状态
 * 0 未开始 1 进行中 2 已结束 3 已停用
 */
const refreshActivityStatus = async () => {
  const now = new Date();

  // 未开始 → 进行中
  await WelfareActivity.update(
    { status: 1 },
    {
      where: {
        status: 0,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      }
    }
  );

  // 进行中 → 已结束
  await WelfareActivity.update(
    { status: 2 },
    {
      where: {
        status: 1,
        end_time: { [Op.lt]: now }
      }
    }
  );

  // 未开始但已过期 → 已结束
  await WelfareActivity.update(
    { status: 2 },
    {
      where: {
        status: 0,
        end_time: { [Op.lt]: now }
      }
    }
  );
};

/**
 * 判断活动是否可进行申领
 */
const isActivityOpen = (activity) => {
  if (!activity) return false;
  if (activity.status === 3) return false;
  const now = new Date();
  return now >= activity.start_time && now <= activity.end_time;
};

module.exports = { refreshActivityStatus, isActivityOpen };
