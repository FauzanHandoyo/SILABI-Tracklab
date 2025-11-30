const notificationModel = require('../models/notificationModel');

const notificationController = {
  // Get all notifications for current user
  getAll: async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await notificationModel.getAllByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notification = await notificationModel.markAsRead(id, userId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await notificationModel.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read', count: notifications.length });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  // Delete notification
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notification = await notificationModel.delete(id, userId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  // Get unread count
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await notificationModel.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }
};

module.exports = notificationController;