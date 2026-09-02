const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/authSession');

const router = express.Router();

router.get('/', requireAuth, notificationController.listNotifications);
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);
router.put('/:id/read', requireAuth, notificationController.markAsRead);

module.exports = router;
