const { Op } = require('sequelize');
const db = require('../models');
const { response, pageResponse } = require('../utils/response');
const applyService = require('../services/apply.service');
const activityService = require('../services/activity.service');

const {
  WelfareActivity, WelfareApply, WelfareApplyItem, GiftInfo, SysUser
} = db;

exports.myList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const where = { user_id: req.userId };
    if (status !== undefined && status !== '') where.apply_status = status;

    const { count, rows } = await WelfareApply.findAndCountAll({
      where,
      include: [
        { model: WelfareActivity, as: 'activity' },
        { model: WelfareApplyItem, as: 'items' }
      ],
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
    const apply = await WelfareApply.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: WelfareActivity, as: 'activity' },
        { model: WelfareApplyItem, as: 'items', include: [{ model: GiftInfo, as: 'gift' }] }
      ]
    });
    if (!apply) return res.status(404).json(response(404, '申领单不存在'));
    res.json(response(200, '操作成功', apply));
  } catch (err) {
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const { activityId, addressId, items } = req.body;

    // 刷新活动状态
    await activityService.refreshActivityStatus();

    const apply = await applyService.submitApply({
      userId: req.userId,
      activityId,
      addressId,
      items
    });

    res.json(response(200, '申领成功', apply));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { addressId, items } = req.body;

    const apply = await WelfareApply.findOne({
      where: { id, user_id: req.userId }
    });
    if (!apply) return res.status(404).json(response(404, '申领单不存在'));

    if (apply.apply_status !== 1) {
      return res.status(400).json(response(400, '只有待发货的申领单可修改'));
    }

    const activity = await WelfareActivity.findByPk(apply.activity_id);
    if (!activityService.isActivityOpen(activity)) {
      return res.status(400).json(response(400, '活动已结束或已停用，无法修改申领'));
    }

    await activityService.refreshActivityStatus();

    const result = await applyService.submitApply({
      userId: req.userId,
      activityId: apply.activity_id,
      addressId,
      items
    });

    res.json(response(200, '修改成功', result));
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const apply = await WelfareApply.findOne({
      where: { id, user_id: req.userId }
    });
    if (!apply) return res.status(404).json(response(404, '申领单不存在'));
    if (apply.apply_status !== 1) {
      return res.status(400).json(response(400, '只有待发货的申领单可取消'));
    }
    const activity = await WelfareActivity.findByPk(apply.activity_id);
    if (!activityService.isActivityOpen(activity)) {
      return res.status(400).json(response(400, '活动已结束或已停用，无法取消申领'));
    }
    await applyService.cancelApply(id, req.userId);
    res.json(response(200, '取消成功'));
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, activityId, status, keyword = '' } = req.query;
    const where = {};
    if (activityId) where.activity_id = activityId;
    if (status !== undefined && status !== '') where.apply_status = status;

    const include = [
      { model: WelfareActivity, as: 'activity' },
      { model: WelfareApplyItem, as: 'items' },
      {
        model: SysUser,
        as: 'user',
        where: keyword ? {
          [Op.or]: [
            { user_no: { [Op.like]: `%${keyword}%` } },
            { real_name: { [Op.like]: `%${keyword}%` } }
          ]
        } : undefined,
        required: !!keyword
      }
    ];

    const { count, rows } = await WelfareApply.findAndCountAll({
      where,
      include,
      order: [['create_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      distinct: true
    });

    res.json(pageResponse(rows, { page: parseInt(page), pageSize: parseInt(pageSize), total: count }));
  } catch (err) {
    next(err);
  }
};
