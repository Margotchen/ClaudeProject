const db = require('../models');
const { Op, QueryTypes } = require('sequelize');

const {
  WelfareActivity, GiftInfo, WelfareApply, WelfareApplyItem, SysUser
} = db;

const getDashboardStats = async () => {
  const [
    totalActivities,
    ongoingActivities,
    totalApplyCount,
    pendingDeliverCount
  ] = await Promise.all([
    WelfareActivity.count(),
    WelfareActivity.count({ where: { status: 1 } }),
    WelfareApply.count({ where: { apply_status: { [Op.ne]: 4 } } }),
    WelfareApply.count({ where: { apply_status: 1 } })
  ]);

  return {
    totalActivities,
    ongoingActivities,
    totalApplyCount,
    pendingDeliverCount
  };
};

const getTopGifts = async (limit = 10) => {
  const sql = `
    SELECT g.gift_name, g.id as gift_id, SUM(i.quantity) as total_quantity
    FROM welfare_apply_item i
    JOIN welfare_apply a ON i.apply_id = a.id
    JOIN gift_info g ON i.gift_id = g.id
    WHERE a.apply_status != 4
    GROUP BY g.id, g.gift_name
    ORDER BY total_quantity DESC
    LIMIT ?
  `;
  return await db.sequelize.query(sql, {
    replacements: [limit],
    type: QueryTypes.SELECT
  });
};

const getDepartmentParticipation = async () => {
  const sql = `
    SELECT
      u.department,
      COUNT(DISTINCT u.id) as apply_users,
      COUNT(DISTINCT total_u.id) as total_users
    FROM sys_user u
    JOIN welfare_apply a ON u.id = a.user_id AND a.apply_status != 4
    LEFT JOIN sys_user total_u
      ON total_u.department = u.department
      AND total_u.status = 1
      AND total_u.role_id = 1
    GROUP BY u.department
  `;
  const rows = await db.sequelize.query(sql, { type: QueryTypes.SELECT });
  return rows.map(r => ({
    department: r.department || '未分配部门',
    apply_users: r.apply_users,
    total_users: r.total_users || r.apply_users,
    rate: r.total_users ? ((r.apply_users / r.total_users) * 100).toFixed(2) : 100
  }));
};

const getDeliveryProgress = async () => {
  const sql = `
    SELECT
      wa.id as activity_id,
      wa.activity_name,
      SUM(CASE WHEN a.apply_status = 1 THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN a.apply_status = 2 THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN a.apply_status = 3 THEN 1 ELSE 0 END) as signed
    FROM welfare_activity wa
    LEFT JOIN welfare_apply a ON wa.id = a.activity_id AND a.apply_status != 4
    GROUP BY wa.id, wa.activity_name
  `;
  return await db.sequelize.query(sql, { type: QueryTypes.SELECT });
};

module.exports = {
  getDashboardStats,
  getTopGifts,
  getDepartmentParticipation,
  getDeliveryProgress
};
