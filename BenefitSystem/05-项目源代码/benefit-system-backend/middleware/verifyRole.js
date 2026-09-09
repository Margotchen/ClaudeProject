const { response } = require('../utils/response');

const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const roleCode = req.roleCode;
    if (!roleCode) {
      return res.status(403).json(response(403, '无法获取用户角色'));
    }

    // admin 默认拥有所有权限
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (roleCode === 'admin' || roles.includes(roleCode)) {
      return next();
    }

    return res.status(403).json(response(403, '无权访问该资源'));
  };
};

module.exports = { verifyRole };
