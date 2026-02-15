const prisma = require('../config/database');

const createNotification = async ({ type, recipientId, senderId, message, ideaId }) => {
  if (recipientId === senderId) return null;
  try {
    return await prisma.notification.create({
      data: { type, recipientId, senderId, message, ideaId },
    });
  } catch (error) {
    console.error('Notification error:', error);
    return null;
  }
};

module.exports = { createNotification };
