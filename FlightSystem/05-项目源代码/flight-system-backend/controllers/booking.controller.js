const bookingService = require('../services/booking.service');
const { response, pageResponse, throwError } = require('../utils/response');

exports.createBooking = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const order = await bookingService.createBooking(req.user.id, req.body);
    res.json(response(200, 'Booking created', order));
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await bookingService.getMyOrders(req.user.id, {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      status: req.query.status
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const status = req.query.status;
    const statusNum = status === undefined || status === '' || status === null
      ? undefined
      : parseInt(status);
    const result = await bookingService.getAllOrders({
      page,
      pageSize,
      status: Number.isNaN(statusNum) ? undefined : statusNum,
      keyword: req.query.keyword
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const order = await bookingService.getOrderDetail(req.params.id);
    if (order.user_id !== req.user.id && req.user.roleCode !== 'service' && req.user.roleCode !== 'operator') {
      throwError('Forbidden', 403);
    }
    res.json(response(200, 'OK', order));
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    await bookingService.cancelOrder(req.user.id, req.params.id);
    res.json(response(200, 'Order cancelled'));
  } catch (err) {
    next(err);
  }
};
