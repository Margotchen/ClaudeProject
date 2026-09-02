const bcrypt = require('bcryptjs');
const db = require('../models');
const { response } = require('../utils/response');

const { SysUser, SysRole } = db;

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json(response(400, 'Username and password are required'));
    }

    const user = await SysUser.findOne({
      where: { username },
      include: [{ model: SysRole, as: 'role', attributes: ['role_code', 'role_name'] }]
    });

    if (!user || !user.status) {
      return res.status(400).json(response(400, 'Invalid username or password'));
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json(response(400, 'Invalid username or password'));
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      roleCode: user.role.role_code,
      roleName: user.role.role_name
    };
    req.session.user = sessionUser;

    res.json(response(200, 'Login successful', { user: sessionUser }));
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie(process.env.SESSION_COOKIE_NAME || 'flight_session');
      res.json(response(200, 'Logout successful'));
    });
  } catch (err) {
    next(err);
  }
};

exports.profile = async (req, res, next) => {
  try {
    const user = await SysUser.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: SysRole, as: 'role', attributes: ['role_code', 'role_name'] }]
    });
    if (!user) {
      return res.status(404).json(response(404, 'User not found'));
    }
    res.json(response(200, 'OK', { user }));
  } catch (err) {
    next(err);
  }
};
