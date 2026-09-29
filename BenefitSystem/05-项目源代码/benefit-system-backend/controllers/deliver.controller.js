const db = require('../models');
const { response } = require('../utils/response');
const logger = require('../utils/logger');

const WelfareApply = db.WelfareApply;

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expressCompany, expressNo, remark } = req.body;

    const apply = await WelfareApply.findByPk(id);
    if (!apply) return res.status(404).json(response(404, '申领单不存在'));
    if (apply.apply_status === 3 || apply.apply_status === 4) {
      return res.status(400).json(response(400, '已签收或已取消的申领单不可修改物流信息'));
    }

    await apply.update({
      apply_status: 2,
      express_company: expressCompany,
      express_no: expressNo,
      deliver_time: new Date()
    });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '发货管理',
      action: '单条发货',
      description: `申领单 ${id} 已发货`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '发货成功', apply));
  } catch (err) {
    next(err);
  }
};

exports.batch = async (req, res, next) => {
  try {
    const { ids, expressCompany, expressNo } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(response(400, '请选择至少一条申领记录'));
    }

    const applies = await WelfareApply.findAll({
      where: { id: ids }
    });

    if (applies.length !== ids.length) {
      return res.status(404).json(response(404, '部分申领单不存在'));
    }

    const invalid = applies.filter(a => a.apply_status !== 1);
    if (invalid.length > 0) {
      return res.status(400).json(response(400, '批量发货仅支持待发货状态的申领单'));
    }

    await WelfareApply.update({
      apply_status: 2,
      express_company: expressCompany,
      express_no: expressNo,
      deliver_time: new Date()
    }, {
      where: { id: ids }
    });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '发货管理',
      action: '批量发货',
      description: `批量发货申领单: ${ids.join(',')}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '批量发货成功'));
  } catch (err) {
    next(err);
  }
};
