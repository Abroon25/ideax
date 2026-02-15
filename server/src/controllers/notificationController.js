const prisma = require('../config/database');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: req.user.id },
        include: { sender: { select: { id: true, username: true, displayName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit),
      }),
      prisma.notification.count({ where: { recipientId: req.user.id } }),
      prisma.notification.count({ where: { recipientId: req.user.id, isRead: false } }),
    ]);

    res.json({ notifications, unreadCount, pagination: { page: parseInt(page), total } });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({ where: { id: { in: ids }, recipientId: req.user.id }, data: { isRead: true } });
    } else {
      await prisma.notification.updateMany({ where: { recipientId: req.user.id, isRead: false }, data: { isRead: true } });
    }
    res.json({ message: 'Marked as read' });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead };
