const { Notification } = require('../models');
const { success, error } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return success(res, { notifications, unreadCount });
  } catch (err) {
    return error(res, 'Failed to fetch notifications', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
      return success(res, null, 'All notifications marked as read');
    }
    const notif = await Notification.findOne({ where: { id, userId: req.user.id } });
    if (!notif) return error(res, 'Notification not found', 404);
    await notif.update({ isRead: true });
    return success(res, notif);
  } catch (err) {
    return error(res, 'Failed to update notification', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return error(res, 'Notification not found', 404);
    await notif.destroy();
    return success(res, null, 'Notification deleted');
  } catch (err) {
    return error(res, 'Failed to delete notification', 500);
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
