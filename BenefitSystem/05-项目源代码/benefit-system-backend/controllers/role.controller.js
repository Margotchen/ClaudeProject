const db = require('../models');
const { response, pageResponse } = require('../utils/response');
const logger = require('../utils/logger');

const SysRole = db.SysRole;

exports.list = async (req, res, next) => {
  try {
    const roles = await SysRole.findAll({ order: [['id', 'ASC']] });
    res.json(response(200, '操作成功', roles));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { roleCode, roleName, description } = req.body;
    const role = await SysRole.create({ role_code: roleCode, role_name: roleName, description });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '角色管理',
      action: '新增角色',
      description: `新增角色 ${roleName}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '新增成功', role));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleName, description } = req.body;
    const role = await SysRole.findByPk(id);
    if (!role) return res.status(404).json(response(404, '角色不存在'));

    await role.update({ role_name: roleName, description });

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '角色管理',
      action: '编辑角色',
      description: `编辑角色 ${role.role_name}`,
      ip: req.ip,
      params: req.body
    });

    res.json(response(200, '更新成功', role));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await SysRole.findByPk(id);
    if (!role) return res.status(404).json(response(404, '角色不存在'));

    await role.destroy();

    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '角色管理',
      action: '删除角色',
      description: `删除角色 ${role.role_name}`,
      ip: req.ip
    });

    res.json(response(200, '删除成功'));
  } catch (err) {
    next(err);
  }
};
