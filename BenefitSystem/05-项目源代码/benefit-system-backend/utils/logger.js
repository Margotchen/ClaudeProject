const db = require('../models');
const SysOperateLog = db.SysOperateLog;

const log = async ({ userId, username, module, action, description, ip, params }) => {
  try {
    await SysOperateLog.create({
      user_id: userId,
      username,
      module,
      action,
      description,
      ip,
      params: params ? JSON.stringify(params) : null
    });
  } catch (err) {
    console.error('操作日志记录失败:', err.message);
  }
};

module.exports = { log };
