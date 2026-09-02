const notificationService = require('../services/notification.service');
const { response, pageResponse, throwError } = require('../utils/response');

exports.listNotifications = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await notificationService.listNotifications(req.user.id, {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      isRead: req.query.isRead
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await notificationService.getUnreadCount(req.user.id);
    res.json(response(200, 'OK', result));
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(response(200, 'Marked as read', notification));
  } catch (err) {
    next(err);
  }
};
