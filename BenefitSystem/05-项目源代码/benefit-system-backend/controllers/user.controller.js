const { Op } = require('sequelize');
const db = require('../models');
const { response, pageResponse } = require('../utils/response');
const { hashPassword } = require('../utils/bcrypt');
const logger = require('../utils/logger');

const SysUser = db.SysUser;
const SysRole = db.SysRole;

exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', roleId, department } = req.query;
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { user_no: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (roleId) where.role_id = roleId;
    if (department) where.department = department;

    const { count, rows } = await SysUser.findAndCountAll({
      where,
      include: [{ model: SysRole, as: 'role', attributes: ['id', 'role_code', 'role_name'] }],
      attributes: { exclude: ['password'] },
      order: [['create_time', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize)
    });

    res.json(pageResponse(rows, { page: parseInt(page), pageSize: parseInt(pageSize), total: count }));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { userNo, username, password, realName, department, phone, roleId } = req.body;
    const hashed = await hashPassword(password || '123456');

    const user = await SysUser.create({
      user_no: userNo,
      username,
      password: hashed,
      real_name: realName,
      department,
      phone,
      role_id: roleId,
      status: 1
    });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '用户管理',
      action: '新增用户',
      description: `新增用户 ${username}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '新增成功', user));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userNo, username, realName, department, phone, roleId, status } = req.body;

    const user = await SysUser.findByPk(id);
    if (!user) return res.status(404).json(response(404, '用户不存在'));

    await user.update({
      user_no: userNo,
      username,
      real_name: realName,
      department,
      phone,
      role_id: roleId,
      status
    });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '用户管理',
      action: '编辑用户',
      description: `编辑用户 ${username}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '更新成功', user));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await SysUser.findByPk(id);
    if (!user) return res.status(404).json(response(404, '用户不存在'));

    await user.destroy();

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '用户管理',
      action: '删除用户',
      description: `删除用户 ${user.username}`,
      ip: req.ip
    });

    res.json(response(200, '删除成功'));
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password = '123456' } = req.body;
    const user = await SysUser.findByPk(id);
    if (!user) return res.status(404).json(response(404, '用户不存在'));

    await user.update({ password: await hashPassword(password) });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '用户管理',
      action: '重置密码',
      description: `重置用户 ${user.username} 密码`,
      ip: req.ip
    });

    res.json(response(200, '密码重置成功'));
  } catch (err) {
    next(err);
  }
};
