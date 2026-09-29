const db = require('../models');
const { Op } = require('sequelize');

const GiftInfo = db.GiftInfo;

/**
 * 扣减库存（条件更新，防止超卖）
 * @param {Array} items - [{ giftId, quantity }]
 * @param {Transaction} transaction
 */
const deductStock = async (items, transaction) => {
  for (const item of items) {
    const [affectedRows] = await GiftInfo.decrement(
      { stock: item.quantity },
      {
        where: {
          id: item.giftId,
          stock: { [Op.gte]: item.quantity }
        },
        transaction
      }
    );

    if (!affectedRows || affectedRows[0] === 0) {
      const gift = await GiftInfo.findByPk(item.giftId, { transaction });
      if (!gift) {
        throw new Error(`礼品不存在: ID=${item.giftId}`);
      }
      throw new Error(`礼品「${gift.gift_name}」库存不足，剩余 ${gift.stock}`);
    }
  }
};

/**
 * 回退库存
 * @param {Array} items - [{ giftId, quantity }]
 * @param {Transaction} transaction
 */
const rollbackStock = async (items, transaction) => {
  for (const item of items) {
    await GiftInfo.increment(
      { stock: item.quantity },
      {
        where: { id: item.giftId },
        transaction
      }
    );
  }
};

module.exports = { deductStock, rollbackStock };
