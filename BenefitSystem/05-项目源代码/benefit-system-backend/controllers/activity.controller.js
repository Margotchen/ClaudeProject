const { Op } = require('sequelize');
const db = require('../models');
const { response, pageResponse } = require('../utils/response');
const activityService = require('../services/activity.service');
const logger = require('../utils/logger');

const WelfareActivity = db.WelfareActivity;
const GiftInfo = db.GiftInfo;
const ActivityGiftRel = db.ActivityGiftRel;
const WelfareApply = db.WelfareApply;

exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status } = req.query;
    const where = {};
    if (keyword) {
      where.activity_name = { [Op.like]: `%${keyword}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = status;
    }

    const { count, rows } = await WelfareActivity.findAndCountAll({
      where,
      order: [['create_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    res.json(pageResponse(rows, { page: parseInt(page), pageSize: parseInt(pageSize), total: count }));
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const activity = await WelfareActivity.findByPk(req.params.id, {
      include: [{
        model: GiftInfo,
        as: 'gifts',
        through: { attributes: [] }
      }]
    });
    if (!activity) return res.status(404).json(response(404, '活动不存在'));

    const stats = {
      totalApply: await WelfareApply.count({ where: { activity_id: activity.id, apply_status: { [Op.ne]: 4 } } }),
      pending: await WelfareApply.count({ where: { activity_id: activity.id, apply_status: 1 } }),
      delivered: await WelfareApply.count({ where: { activity_id: activity.id, apply_status: 2 } }),
      signed: await WelfareApply.count({ where: { activity_id: activity.id, apply_status: 3 } })
    };

    res.json(response(200, '操作成功', { ...activity.toJSON(), stats }));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      create_by: req.userId,
      status: 0
    };
    const activity = await WelfareActivity.create(data);

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '福利活动',
      action: '新增活动',
      description: `新增活动 ${activity.activity_name}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '新增成功', activity));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const activity = await WelfareActivity.findByPk(req.params.id);
    if (!activity) return res.status(404).json(response(404, '活动不存在'));

    // 进行中的活动限制修改关键字段
    if (activity.status === 1) {
      // 允许修改说明、结束时间、limit_count，但不允许修改开始时间等
    }

    await activity.update(req.body);

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '福利活动',
      action: '编辑活动',
      description: `编辑活动 ${activity.activity_name}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '更新成功', activity));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const activity = await WelfareActivity.findByPk(req.params.id);
    if (!activity) return res.status(404).json(response(404, '活动不存在'));

    if (activity.status === 1) {
      return res.status(400).json(response(400, '进行中的活动不可删除，请先停用'));
    }

    const applyCount = await WelfareApply.count({ where: { activity_id: activity.id } });
    if (applyCount > 0) {
      return res.status(400).json(response(400, `该活动下存在 ${applyCount} 条申领记录，无法删除`));
    }

    await ActivityGiftRel.destroy({ where: { activity_id: activity.id } });
    await activity.destroy();

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '福利活动',
      action: '删除活动',
      description: `删除活动 ${activity.activity_name}`,
      ip: req.ip
    });

    res.json(response(200, '删除成功'));
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const activity = await WelfareActivity.findByPk(req.params.id);
    if (!activity) return res.status(404).json(response(404, '活动不存在'));

    await activity.update({ status });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '福利活动',
      action: '启停活动',
      description: `活动 ${activity.activity_name} 状态改为 ${status}`,
      ip: req.ip
    });

    res.json(response(200, '操作成功', activity));
  } catch (err) {
    next(err);
  }
};

exports.getGifts = async (req, res, next) => {
  try {
    const activity = await WelfareActivity.findByPk(req.params.id, {
      include: [{
        model: GiftInfo,
        as: 'gifts',
        through: { attributes: [] }
      }]
    });
    if (!activity) return res.status(404).json(response(404, '活动不存在'));
    res.json(response(200, '操作成功', activity.gifts));
  } catch (err) {
    next(err);
  }
};

exports.setGifts = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { giftIds } = req.body;

    const activity = await WelfareActivity.findByPk(id, { transaction });
    if (!activity) return res.status(404).json(response(404, '活动不存在'));

    await ActivityGiftRel.destroy({ where: { activity_id: id }, transaction });

    if (giftIds && giftIds.length > 0) {
      const relations = giftIds.map(giftId => ({ activity_id: id, gift_id: giftId }));
      await ActivityGiftRel.bulkCreate(relations, { transaction });
    }

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '福利活动',
      action: '配置礼品',
      description: `为活动 ${activity.activity_name} 配置礼品`,
      ip: req.ip,
      params: req.body
    });

    await transaction.commit();
    res.json(response(200, '配置成功'));
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAvailableActivities = async (req, res, next) => {
  try {
    await activityService.refreshActivityStatus();
    const now = new Date();
    const activities = await WelfareActivity.findAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      },
      order: [['create_time', 'DESC']]
    });
    res.json(response(200, '操作成功', activities));
  } catch (err) {
    next(err);
  }
};
