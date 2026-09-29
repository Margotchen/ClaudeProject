const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const db = require('../models');
const { response } = require('../utils/response');
const { comparePassword } = require('../utils/bcrypt');
const logger = require('../utils/logger');

const SysUser = db.SysUser;
const SysRole = db.SysRole;

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await SysUser.findOne({
      where: { username },
      include: [{ model: SysRole, as: 'role', attributes: ['id', 'role_code', 'role_name'] }]
    });

    if (!user) {
      return res.status(400).json(response(400, '用户名或密码错误'));
    }

    if (user.status !== 1) {
      return res.status(400).json(response(400, '账号已被禁用'));
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(400).json(response(400, '用户名或密码错误'));
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, roleCode: user.role.role_code },
      config.secret,
      { expiresIn: config.expiresIn }
    );

    await logger.log({
      userId: user.id,
      username: user.username,
      module: '认证',
      action: '登录',
      description: `${user.username} 登录系统`,
      ip: req.ip
    });

    res.json(response(200, '登录成功', {
      token,
      user: {
        id: user.id,
        userNo: user.user_no,
        username: user.username,
        realName: user.real_name,
        department: user.department,
        phone: user.phone,
        role: user.role
      }
    }));
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await logger.log({
      userId: req.userId,
      username: req.username,
      module: '认证',
      action: '登出',
      description: `${req.username} 登出系统`,
      ip: req.ip
    });
    res.json(response(200, '登出成功'));
  } catch (err) {
    next(err);
  }
};

exports.userinfo = async (req, res, next) => {
  try {
    const user = await SysUser.findByPk(req.userId, {
      attributes: { exclude: ['password'] },
      include: [{ model: SysRole, as: 'role', attributes: ['id', 'role_code', 'role_name'] }]
    });
    res.json(response(200, '操作成功', user));
  } catch (err) {
    next(err);
  }
};
