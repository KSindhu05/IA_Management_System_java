const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Announcement, Subject, User, Student, CIEMark, Notification } = require('../models');
const { Op } = require('sequelize');

// --- Student Endpoints ---

// Get Student Announcements (Real Data)
// For now, fetching all announcements for subjects the student is enrolled in would be ideal.
// But we might need a relation between Student and Subject (Enrollment).
// Assuming valid student for now.
router.get('/student/announcements', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Todo: Filter by student's subjects. For now, fetch all active announcements.
        // In a real app, we'd query Enrollment table.
        const announcements = await Announcement.findAll({
            where: {
                status: 'SCHEDULED',
                scheduledDate: {
                    [Op.gte]: today // Only show pending or future exams
                }
            },
            include: [
                { model: Subject, attributes: ['name', 'code'] },
                { model: User, as: 'faculty', attributes: ['username'] }
            ],
            order: [['scheduledDate', 'ASC']]
        });

        // Format for frontend
        const formatted = announcements.map(a => ({
            id: a.id,
            cieNumber: a.cieNumber.toString(),
            subject: { name: a.Subject ? a.Subject.name : 'Unknown Subject' },
            scheduledDate: a.scheduledDate,
            startTime: a.startTime,
            durationMinutes: a.durationMinutes,
            examRoom: a.examRoom,
            instructions: a.instructions,
            faculty: a.faculty ? a.faculty.username : 'Unknown'
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get student announcements error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Student Notifications (Based on their subjects and marks)
router.get('/student/notifications', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const studentRegNo = req.user.username;

        // Find student first
        const student = await Student.findOne({ where: { regNo: studentRegNo } });

        if (!student) {
            return res.json([
                { id: 1, message: 'Welcome to the IA Management System!', type: 'INFO', isRead: false, createdAt: new Date() }
            ]);
        }

        // Find student's subjects through their marks using studentId
        const studentMarks = await CIEMark.findAll({
            where: { studentId: student.id },
            include: [
                { model: Subject, as: 'subject', attributes: ['name', 'code', 'id'] }
            ],
            order: [['id', 'DESC']],
            limit: 10
        });

        if (!studentMarks || studentMarks.length === 0) {
            return res.json([
                { id: 1, message: 'Welcome to the IA Management System!', type: 'INFO', isRead: false, createdAt: new Date() }
            ]);
        }

        // Get unique subjects
        const subjectSet = new Set();
        const notifications = [];
        let notifId = 1;

        studentMarks.forEach(mark => {
            if (mark.subject && !subjectSet.has(mark.subject.id)) {
                subjectSet.add(mark.subject.id);

                // Create notification for recent mark upload
                notifications.push({
                    id: notifId++,
                    message: `${mark.cieType} marks for ${mark.subject.name} have been uploaded`,
                    type: 'CIE_ANNOUNCEMENT',
                    isRead: false,
                    createdAt: mark.createdAt || new Date()
                });
            }
        });

        // If no notifications, add welcome message
        if (notifications.length === 0) {
            notifications.push({
                id: 1,
                message: 'Welcome to the IA Management System!',
                type: 'INFO',
                isRead: false,
                createdAt: new Date()
            });
        }

        res.json(notifications);
    } catch (error) {
        console.error('Get student notifications error:', error);
        res.json([
            { id: 1, message: 'Welcome to the IA Management System!', type: 'INFO', isRead: false, createdAt: new Date() }
        ]);
    }
});

// --- Faculty Endpoints ---

// Get Announcement Details (for edit/view)
router.get('/faculty/announcements/details', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const { subjectId, cieNumber } = req.query;
        if (!subjectId || !cieNumber) {
            return res.status(400).json({ message: 'Missing subjectId or cieNumber' });
        }

        const announcement = await Announcement.findOne({
            where: {
                subjectId,
                cieNumber,
                // facultyId: req.user.id // Optional: strict check if only creator can see
            }
        });

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json(announcement);
    } catch (error) {
        console.error('Get announcement details error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Faculty Notifications
router.get('/faculty/notifications', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { limit = 20 } = req.query;

        const notifications = await Notification.findAll({
            where: { userId: facultyId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get faculty notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get All CIE Schedules for Faculty (Read-only, published by HOD)
router.get('/faculty/schedules', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        // Faculty can view all scheduled CIE exams for their subjects
        // In a full implementation, filter by faculty's assigned subjects
        const announcements = await Announcement.findAll({
            where: { status: 'SCHEDULED' },
            include: [
                { model: Subject, attributes: ['name', 'code', 'department'] },
                { model: User, as: 'faculty', attributes: ['username', 'fullName'] }
            ],
            order: [['scheduledDate', 'ASC']]
        });

        // Format for frontend consumption
        const formatted = announcements.map(ann => ({
            id: ann.id,
            cieNumber: ann.cieNumber,
            scheduledDate: ann.scheduledDate,
            startTime: ann.startTime,
            durationMinutes: ann.durationMinutes,
            examRoom: ann.examRoom,
            instructions: ann.instructions,
            status: ann.status,
            subject: ann.Subject ? {
                name: ann.Subject.name,
                code: ann.Subject.code,
                department: ann.Subject.department
            } : null,
            publishedBy: ann.faculty ? (ann.faculty.fullName || ann.faculty.username) : 'HOD'
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get faculty schedules error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get All Faculty Announcements (list view)
router.get('/faculty/announcements/list', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const facultyId = req.user.id;

        const announcements = await Announcement.findAll({
            where: { facultyId },
            include: [
                { model: Subject, attributes: ['name', 'code'] }
            ],
            order: [['scheduledDate', 'DESC']]
        });

        res.json(announcements);
    } catch (error) {
        console.error('Get faculty announcements list error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create/Update Announcement
router.post('/faculty/announcements', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const { subjectId, cieNumber, scheduledDate, startTime, durationMinutes, examRoom, instructions, syllabusCoverage } = req.body;

        // Upsert logic
        const [announcement, created] = await Announcement.findOrCreate({
            where: { subjectId, cieNumber },
            defaults: {
                scheduledDate,
                startTime,
                durationMinutes,
                examRoom,
                instructions,
                syllabusCoverage,
                facultyId: req.user.id,
                status: 'SCHEDULED'
            }
        });

        if (!created) {
            await announcement.update({
                scheduledDate,
                startTime,
                durationMinutes,
                examRoom,
                instructions,
                syllabusCoverage,
                facultyId: req.user.id // Update faculty if changed?
            });
        }

        res.json({ message: 'Announcement saved successfully', announcement });
    } catch (error) {
        console.error('Save announcement error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- HOD Endpoints ---

// Get HOD Notifications
router.get('/hod/notifications', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const hodId = req.user.id;
        const { limit = 20 } = req.query;

        const notifications = await Notification.findAll({
            where: { userId: hodId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get HOD notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create/Update CIE Announcement (HOD only)
router.post('/announcements', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { subjectId } = req.query;
        const { cieNumber, scheduledDate, startTime, durationMinutes, examRoom, instructions, syllabusCoverage } = req.body;

        if (!subjectId) {
            return res.status(400).json({ message: 'Missing subjectId query parameter' });
        }

        // Upsert logic - create or update announcement
        const [announcement, created] = await Announcement.findOrCreate({
            where: { subjectId, cieNumber },
            defaults: {
                scheduledDate,
                startTime,
                durationMinutes: durationMinutes || 60,
                examRoom,
                instructions,
                syllabusCoverage,
                facultyId: req.user.id, // HOD creating the announcement
                status: 'SCHEDULED'
            }
        });

        if (!created) {
            await announcement.update({
                scheduledDate,
                startTime,
                durationMinutes: durationMinutes || 60,
                examRoom,
                instructions,
                syllabusCoverage
            });
        }

        res.json({ message: 'CIE Schedule published successfully', announcement });
    } catch (error) {
        console.error('HOD publish schedule error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get All Announcements for HOD (Department view)
router.get('/hod/announcements', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        // Ideally filter by HOD's department. 
        // Assuming HOD sees all or we filter by user's dept if stored in token.
        // For now, return all.
        const announcements = await Announcement.findAll({
            include: [
                { model: Subject, attributes: ['name', 'code'] },
                { model: User, as: 'faculty', attributes: ['username'] }
            ],
            order: [['scheduledDate', 'ASC']]
        });

        res.json(announcements);
    } catch (error) {
        console.error('Get HOD announcements error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
