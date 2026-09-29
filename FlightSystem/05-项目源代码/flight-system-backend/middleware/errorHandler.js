const { response } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Global error:', err);

  // Sequelize 校验错误
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors?.map(e => e.message).join('; ') || '数据校验失败';
    return res.status(400).json(response(400, message));
  }

  // 业务自定义错误
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json(response(err.statusCode, err.message));
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : (err.message || '服务器内部错误');

  res.status(statusCode).json(response(statusCode, message));
};

module.exports = { errorHandler };
