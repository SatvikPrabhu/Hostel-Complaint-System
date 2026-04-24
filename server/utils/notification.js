const pool = require('../config/database');

/**
 * Create a notification for a user
 * @param {number} userId - The ID of the user to notify
 * @param {number} complaintId - The ID of the related complaint
 * @param {string} type - The type of notification (task_assigned, task_completed, new_complaint)
 * @param {string} message - The notification message
 */
const createNotification = async (userId, complaintId, type, message) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, complaint_id, type, message) VALUES ($1, $2, $3, $4)',
      [userId, complaintId, type, message]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

module.exports = { createNotification };
