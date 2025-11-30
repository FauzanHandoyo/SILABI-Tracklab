const pool = require('../../db');

const notificationModel = {
  // Get all notifications for a user
  getAllByUserId: async (userId) => {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Create a new notification
  create: async (userId, title, message, type = 'info') => {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, title, message, type]);
    return result.rows[0];
  },

  // Mark notification as read
  markAsRead: async (id, userId) => {
    const query = `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId) => {
    const query = `
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Delete a notification
  delete: async (id, userId) => {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
};

module.exports = notificationModel;