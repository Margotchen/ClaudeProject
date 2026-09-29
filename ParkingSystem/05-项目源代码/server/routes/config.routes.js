const express = require('express');
const { run, get, all } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { operationLogger } = require('../middleware/logger');

const router = express.Router();

// 获取配置列表
router.get('/', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const list = await all(`SELECT * FROM system_configs ORDER BY id`);
    success(res, list);
  } catch (err) {
    next(err);
  }
});

// 更新配置
router.put('/:key', authMiddleware(['system_admin']), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { configValue } = req.body;
    if (configValue === undefined || configValue === null) {
      return fail(res, '配置值不能为空');
    }

    await run(
      `UPDATE system_configs SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?`,
      [configValue, key]
    );

    await operationLogger(req.user.id, 'config', 'update', { key, value: configValue }, req.ip);
    success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
