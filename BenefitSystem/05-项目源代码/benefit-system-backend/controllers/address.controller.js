const db = require('../models');
const { response } = require('../utils/response');

const UserAddress = db.UserAddress;

exports.list = async (req, res, next) => {
  try {
    const addresses = await UserAddress.findAll({
      where: { user_id: req.userId },
      order: [['is_default', 'DESC'], ['create_time', 'DESC']]
    });
    res.json(response(200, '操作成功', addresses));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const data = { ...req.body, user_id: req.userId };

    if (data.is_default === 1) {
      await UserAddress.update(
        { is_default: 0 },
        { where: { user_id: req.userId }, transaction }
      );
    }

    const address = await UserAddress.create(data, { transaction });
    await transaction.commit();
    res.json(response(200, '新增成功', address));
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const address = await UserAddress.findOne({ where: { id, user_id: req.userId }, transaction });
    if (!address) {
      await transaction.rollback();
      return res.status(404).json(response(404, '地址不存在'));
    }

    if (req.body.is_default === 1) {
      await UserAddress.update(
        { is_default: 0 },
        { where: { user_id: req.userId }, transaction }
      );
    }

    await address.update(req.body, { transaction });
    await transaction.commit();
    res.json(response(200, '更新成功', address));
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const address = await UserAddress.findOne({ where: { id, user_id: req.userId } });
    if (!address) return res.status(404).json(response(404, '地址不存在'));

    await address.destroy();
    res.json(response(200, '删除成功'));
  } catch (err) {
    next(err);
  }
};

exports.setDefault = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const address = await UserAddress.findOne({ where: { id, user_id: req.userId }, transaction });
    if (!address) {
      await transaction.rollback();
      return res.status(404).json(response(404, '地址不存在'));
    }

    await UserAddress.update(
      { is_default: 0 },
      { where: { user_id: req.userId }, transaction }
    );
    await address.update({ is_default: 1 }, { transaction });

    await transaction.commit();
    res.json(response(200, '设置成功', address));
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
