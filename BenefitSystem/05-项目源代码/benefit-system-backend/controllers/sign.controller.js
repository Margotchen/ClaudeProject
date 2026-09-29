const db = require('../models');
const { response } = require('../utils/response');
const logger = require('../utils/logger');

const WelfareApply = db.WelfareApply;

exports.sign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const apply = await WelfareApply.findOne({
      where: { id, user_id: req.userId }
    });
    if (!apply) return res.status(404).json(response(404, '申领单不存在'));
    if (apply.apply_status !== 2) {
      return res.status(400).json(response(400, '只有已发货的申领单可签收'));
    }

    await apply.update({
      apply_status: 3,
      sign_time: new Date(),
      feedback: feedback || null
    });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '签收反馈',
      action: '确认签收',
      description: `申领单 ${id} 已签收`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '签收成功', apply));
  } catch (err) {
    next(err);
  }
};

exports.listFeedback = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { count, rows } = await WelfareApply.findAndCountAll({
      where: {
        apply_status: 3,
        feedback: { [db.Sequelize.Op.ne]: null }
      },
      include: [
        { model: db.WelfareActivity, as: 'activity' },
        { model: db.SysUser, as: 'user', attributes: ['id', 'user_no', 'real_name', 'department'] }
      ],
      order: [['sign_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    const { pageResponse } = require('../utils/response');
    res.json(pageResponse(rows, { page: parseInt(page), pageSize: parseInt(pageSize), total: count }));
  } catch (err) {
    next(err);
  }
};
