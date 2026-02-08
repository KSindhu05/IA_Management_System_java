const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Student, CIEMark, Subject } = require('../models');

// Get student notifications (Dynamic based on Approved Marks)
router.get('/student/notifications', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const student = await Student.findOne({ where: { regNo: req.user.username } });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Fetch approved marks to generate notifications
        const approvedMarks = await CIEMark.findAll({
            where: {
                studentId: student.id,
                status: 'APPROVED'
            },
            include: [{ model: Subject, as: 'subject' }],
            order: [['updatedAt', 'DESC']],
            limit: 10
        });

        const notifications = approvedMarks.map(mark => ({
            id: mark.id,
            type: 'CIE_UPDATE', // Mapping to 'info' or 'alert' in frontend
            message: `Your marks for ${mark.subject.name} (${mark.cieType}) have been approved and published.`,
            createdAt: mark.updatedAt,
            isRead: false // No DB to store read status, so always unread for now
        }));

        // Add a welcome notification if empty
        if (notifications.length === 0) {
            notifications.push({
                id: 0,
                type: 'SYSTEM',
                message: 'Welcome to the CIE Management System. No new updates.',
                createdAt: new Date(),
                isRead: true
            });
        }

        res.json(notifications);

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get student announcements (Mock data for now)
router.get('/student/announcements', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        // In a real app, this would come from an Announcement model
        const announcements = [
            {
                id: 1,
                cieNumber: '1',
                subject: { name: 'Engineering Maths-II' },
                scheduledDate: '2026-02-15',
                startTime: '10:00:00',
                durationMinutes: 60,
                examRoom: 'LH-101',
                instructions: 'Bring scientific calculator.'
            },
            {
                id: 2,
                cieNumber: '1',
                subject: { name: 'Data Structures' },
                scheduledDate: '2026-02-16',
                startTime: '14:00:00',
                durationMinutes: 90,
                examRoom: 'Lab-2',
                instructions: 'Closed book exam.'
            }
        ];

        res.json(announcements);
    } catch (error) {
        console.error('Announcements error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
