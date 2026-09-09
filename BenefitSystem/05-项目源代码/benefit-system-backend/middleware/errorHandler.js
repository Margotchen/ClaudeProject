const { response } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json(response(400, '参数校验失败', { errors: messages }));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(response(400, '数据已存在', { field: err.errors[0]?.path }));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json(response(400, '关联数据不存在'));
  }

  res.status(err.status || 500).json(response(
    err.status || 500,
    err.message || '服务器内部错误'
  ));
};

module.exports = { errorHandler };
