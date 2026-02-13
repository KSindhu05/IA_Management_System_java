const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Notification, User } = require('../models');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { isRead, limit = 50 } = req.query;

        const whereClause = { userId };
        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }

        const notifications = await Notification.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create notification (admin/system use)
router.post('/', authMiddleware, roleMiddleware('HOD', 'PRINCIPAL', 'FACULTY'), async (req, res) => {
    try {
        const { userId, message, type, link, category } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const notification = await Notification.create({
            userId,
            message,
            type: type || 'INFO',
            link,
            category
        });

        res.json({ message: 'Notification created', notification });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.update({ isRead: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get unread count
router.get('/unread/count', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({ count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Broadcast notification
router.post('/broadcast', authMiddleware, roleMiddleware('HOD', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
    try {
        const { recipientType, message, department, category } = req.body;
        // senderId is available via req.user.id

        if (!recipientType || !message) {
            return res.status(400).json({ message: 'Missing recipientType or message' });
        }

        let whereClause = {};

        // Filter by role
        if (recipientType === 'FACULTY') {
            whereClause.role = 'FACULTY';
        } else if (recipientType === 'STUDENT') {
            whereClause.role = 'STUDENT';
        } else if (recipientType === 'PRINCIPAL') {
            whereClause.role = 'PRINCIPAL';
        } else if (recipientType === 'BOTH') {
            whereClause.role = ['FACULTY', 'STUDENT'];
        }

        // Filter by department if provided (and not Principal who might send to all)
        // If recipientType is PRINCIPAL, usually we don't filter by department unless specified
        if (department && department !== 'All' && recipientType !== 'PRINCIPAL') {
            whereClause.department = department;
        }

        const users = await User.findAll({ where: whereClause, attributes: ['id'] });

        if (users.length === 0) {
            return res.json({ message: 'No recipients found', count: 0 });
        }

        const notifications = users.map(user => ({
            userId: user.id,
            message,
            type: 'INFO',
            category: category || 'ANNOUNCEMENT',
            isRead: false
        }));

        await Notification.bulkCreate(notifications);

        res.json({ message: `Notification sent to ${users.length} users`, count: users.length });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
