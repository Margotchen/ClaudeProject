const db = require('../models');
const { Op } = require('sequelize');
const inventoryService = require('./inventory.service');
const activityService = require('./activity.service');

const {
  WelfareActivity, GiftInfo, WelfareApply, WelfareApplyItem,
  UserAddress, SysUser
} = db;

/**
 * 校验申领数据是否合法
 */
const validateApplyData = async (activityId, items, userId, transaction) => {
  const activity = await WelfareActivity.findByPk(activityId, { transaction });
  if (!activity) {
    throw new Error('活动不存在');
  }

  if (!activityService.isActivityOpen(activity)) {
    throw new Error('活动未开始、已结束或已停用，无法申领');
  }

  // 校验礼品是否属于该活动
  const activityGiftIds = await db.ActivityGiftRel.findAll({
    where: { activity_id: activityId },
    attributes: ['gift_id'],
    transaction
  }).then(rows => rows.map(r => r.gift_id));

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalCount === 0) {
    throw new Error('请选择至少一件礼品');
  }
  if (totalCount > activity.limit_count) {
    throw new Error(`每人最多可申领 ${activity.limit_count} 件礼品，当前 ${totalCount} 件`);
  }

  const giftMap = {};
  for (const item of items) {
    if (!activityGiftIds.includes(item.giftId)) {
      throw new Error('存在不属于当前活动的礼品');
    }
    if (item.quantity <= 0) {
      throw new Error('申领数量必须大于 0');
    }
    const gift = await GiftInfo.findByPk(item.giftId, { transaction });
    if (!gift || gift.status !== 1) {
      throw new Error(`礼品「${gift?.gift_name || item.giftId}」已下架或不存在`);
    }
    giftMap[item.giftId] = gift;
  }

  return { activity, totalCount, giftMap };
};

/**
 * 提交或覆盖申领单
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.activityId
 * @param {number} params.addressId
 * @param {Array} params.items - [{ giftId, quantity }]
 */
const submitApply = async ({ userId, activityId, addressId, items }) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { activity, totalCount, giftMap } = await validateApplyData(activityId, items, userId, transaction);

    const address = await UserAddress.findOne({
      where: { id: addressId, user_id: userId },
      transaction
    });
    if (!address) {
      throw new Error('收货地址不存在');
    }

    // 查询是否已有申领单
    const existingApply = await WelfareApply.findOne({
      where: { activity_id: activityId, user_id: userId },
      transaction
    });

    let oldItems = [];
    if (existingApply) {
      // 仅允许修改待发货的申领单
      if (existingApply.apply_status !== 1) {
        throw new Error('只有待发货的申领单可修改');
      }

      oldItems = await WelfareApplyItem.findAll({
        where: { apply_id: existingApply.id },
        transaction
      }).then(rows => rows.map(r => ({ giftId: r.gift_id, quantity: r.quantity })));

      // 回退旧库存
      await inventoryService.rollbackStock(oldItems, transaction);
      // 删除旧明细
      await WelfareApplyItem.destroy({
        where: { apply_id: existingApply.id },
        transaction
      });
    }

    // 扣减新库存
    await inventoryService.deductStock(items, transaction);

    const addressSnapshot = `${address.province}${address.city}${address.district}${address.detail_address}`;

    let apply;
    if (existingApply) {
      apply = await existingApply.update({
        total_count: totalCount,
        receiver_snapshot: address.receiver,
        phone_snapshot: address.phone,
        address_snapshot: addressSnapshot,
        apply_status: 1,
        express_company: null,
        express_no: null,
        deliver_time: null,
        sign_time: null,
        feedback: null
      }, { transaction });
    } else {
      apply = await WelfareApply.create({
        activity_id: activityId,
        user_id: userId,
        total_count: totalCount,
        receiver_snapshot: address.receiver,
        phone_snapshot: address.phone,
        address_snapshot: addressSnapshot,
        apply_status: 1
      }, { transaction });
    }

    // 创建申领明细
    const itemRecords = items.map(item => ({
      apply_id: apply.id,
      gift_id: item.giftId,
      gift_name_snapshot: giftMap[item.giftId].gift_name,
      spec_snapshot: giftMap[item.giftId].specification,
      quantity: item.quantity
    }));
    await WelfareApplyItem.bulkCreate(itemRecords, { transaction });

    await transaction.commit();
    return apply;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * 取消申领（回退库存）
 */
const cancelApply = async (applyId, userId) => {
  const transaction = await db.sequelize.transaction();
  try {
    const apply = await WelfareApply.findOne({
      where: { id: applyId, user_id: userId },
      transaction
    });
    if (!apply) {
      throw new Error('申领单不存在');
    }
    if (apply.apply_status !== 1) {
      throw new Error('只有待发货的申领单可取消');
    }

    const activity = await WelfareActivity.findByPk(apply.activity_id, { transaction });
    if (!activityService.isActivityOpen(activity)) {
      throw new Error('活动已结束，无法取消');
    }

    const items = await WelfareApplyItem.findAll({
      where: { apply_id: applyId },
      transaction
    }).then(rows => rows.map(r => ({ giftId: r.gift_id, quantity: r.quantity })));

    await inventoryService.rollbackStock(items, transaction);
    await WelfareApplyItem.destroy({ where: { apply_id: applyId }, transaction });
    await apply.update({ apply_status: 4, total_count: 0 }, { transaction });

    await transaction.commit();
    return apply;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = { submitApply, cancelApply, validateApplyData };
