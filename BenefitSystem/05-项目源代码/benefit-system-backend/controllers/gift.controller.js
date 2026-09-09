const { Op } = require('sequelize');
const db = require('../models');
const { response, pageResponse } = require('../utils/response');
const logger = require('../utils/logger');

const GiftInfo = db.GiftInfo;
const WelfareActivity = db.WelfareActivity;
const ActivityGiftRel = db.ActivityGiftRel;
const WelfareApplyItem = db.WelfareApplyItem;

exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status } = req.query;
    const where = {};
    if (keyword) {
      where.gift_name = { [Op.like]: `%${keyword}%` };
    }
    if (status !== undefined && status !== '') {
      where.status = status;
    }

    const { count, rows } = await GiftInfo.findAndCountAll({
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
    const gift = await GiftInfo.findByPk(req.params.id);
    if (!gift) return res.status(404).json(response(404, '礼品不存在'));
    res.json(response(200, '操作成功', gift));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const gift = await GiftInfo.create(req.body);

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '礼品库',
      action: '新增礼品',
      description: `新增礼品 ${gift.gift_name}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '新增成功', gift));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const gift = await GiftInfo.findByPk(req.params.id);
    if (!gift) return res.status(404).json(response(404, '礼品不存在'));

    await gift.update(req.body);

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '礼品库',
      action: '编辑礼品',
      description: `编辑礼品 ${gift.gift_name}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '更新成功', gift));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const gift = await GiftInfo.findByPk(req.params.id);
    if (!gift) return res.status(404).json(response(404, '礼品不存在'));

    // 检查是否关联进行中活动
    const ongoingRelation = await ActivityGiftRel.findOne({
      where: { gift_id: gift.id },
      include: [{
        model: WelfareActivity,
        as: 'activity',
        where: { status: 1 },
        required: true
      }]
    });

    if (ongoingRelation) {
      return res.status(400).json(response(400, '该礼品已关联进行中活动，无法删除'));
    }

    const applyItemCount = await WelfareApplyItem.count({ where: { gift_id: gift.id } });
    if (applyItemCount > 0) {
      return res.status(400).json(response(400, `该礼品已被 ${applyItemCount} 条历史申领记录引用，无法删除，建议下架`));
    }

    await gift.destroy();

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '礼品库',
      action: '删除礼品',
      description: `删除礼品 ${gift.gift_name}`,
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
    const gift = await GiftInfo.findByPk(req.params.id);
    if (!gift) return res.status(404).json(response(404, '礼品不存在'));

    await gift.update({ status });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '礼品库',
      action: '上下架',
      description: `礼品 ${gift.gift_name} 状态改为 ${status}`,
      ip: req.ip
    });

    res.json(response(200, '操作成功', gift));
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const gift = await GiftInfo.findByPk(req.params.id);
    if (!gift) return res.status(404).json(response(404, '礼品不存在'));

    await gift.update({ stock });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '礼品库',
      action: '库存调整',
      description: `礼品 ${gift.gift_name} 库存调整为 ${stock}`,
      ip: req.ip
    });

    res.json(response(200, '库存调整成功', gift));
  } catch (err) {
    next(err);
  }
};
