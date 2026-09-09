function success(res, data = null, message = '操作成功') {
  res.json({
    code: 200,
    message,
    data,
    timestamp: Date.now()
  });
}

function fail(res, message = '操作失败', code = 400, statusCode = 200) {
  res.status(statusCode).json({
    code,
    message,
    data: null,
    timestamp: Date.now()
  });
}

module.exports = { success, fail };
