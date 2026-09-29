const { response } = require('../utils/response');

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(response(401, 'Please login first'));
    }
    const userRole = req.user.roleCode;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json(response(403, 'Insufficient permissions'));
    }
    next();
  };
};

module.exports = { verifyRole };
