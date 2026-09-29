function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err);
  res.status(err.statusCode || 500).json({
    code: err.code || 500,
    message: err.message || '服务器内部错误',
    data: null,
    timestamp: Date.now()
  });
}

module.exports = errorHandler;
