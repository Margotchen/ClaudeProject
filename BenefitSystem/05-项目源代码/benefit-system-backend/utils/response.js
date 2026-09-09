const response = (code = 200, message = '操作成功', data = null) => {
  const result = { code, message };
  if (data !== null && data !== undefined) {
    result.data = data;
  }
  return result;
};

const pageResponse = (list, pagination) => {
  return response(200, '操作成功', {
    list,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total
    }
  });
};

module.exports = { response, pageResponse };
