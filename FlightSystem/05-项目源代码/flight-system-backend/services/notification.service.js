const db = require('../models');
const { throwError } = require('../utils/response');

const { Notification } = db;

class NotificationService {
  async listNotifications(userId, { page = 1, pageSize = 10, isRead }) {
    const where = { user_id: userId };
    if (isRead !== undefined && isRead !== '') where.is_read = isRead;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return {
      list: rows,
      pagination: { page, pageSize, total: count }
    };
  }

  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: { user_id: userId, is_read: 0 }
    });
    return { count };
  }

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) throwError('Notification not found', 404);
    if (notification.user_id !== userId) throwError('Forbidden', 403);
    await notification.update({ is_read: 1 });
    return notification;
  }
}

module.exports = new NotificationService();
