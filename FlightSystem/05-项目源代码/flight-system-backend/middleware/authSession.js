const { response } = require('../utils/response');

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json(response(401, 'Please login first'));
  }
  req.user = req.session.user;
  next();
};

module.exports = { requireAuth };
