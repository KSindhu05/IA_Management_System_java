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
// Get Student Announcements (Filtered by Department & Semester)
router.get('/student/announcements', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const studentRegNo = req.user.username;
        const student = await Student.findOne({ where: { regNo: studentRegNo } });

        if (!student) {
            // Fallback if student profile is missing (shouldn't happen for valid users)
            return res.json([]);
        }

        // Find subjects for this student's department and semester
        // Note: In a real system, we'd check an Enrollment table. 
        // Here we assume all students in a sem/dept take the same subjects.
        const subjects = await Subject.findAll({
            where: {
                department: student.department,
                semester: student.semester
            },
            attributes: ['id']
        });

        const subjectIds = subjects.map(s => s.id);

        const announcements = await Announcement.findAll({
            where: {
                status: 'SCHEDULED',
                subjectId: {
                    [Op.in]: subjectIds
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
            syllabusCoverage: a.syllabusCoverage, // Added field
            faculty: a.faculty ? a.faculty.username : 'Unknown'
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get student announcements error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Student Notifications (Based on their subjects and marks)
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

        const notifications = [];
        let notifId = 1;

        // 1. Get Exam Schedule Notifications (Announcements)
        // Find subjects for this student's department and semester
        const subjects = await Subject.findAll({
            where: {
                department: student.department,
                semester: student.semester
            },
            attributes: ['id', 'name']
        });
        const subjectIds = subjects.map(s => s.id);

        if (subjectIds.length > 0) {
            const announcements = await Announcement.findAll({
                where: {
                    status: 'SCHEDULED',
                    subjectId: { [Op.in]: subjectIds }
                },
                include: [{ model: Subject, attributes: ['name'] }],
                order: [['createdAt', 'DESC']],
                limit: 5
            });

            announcements.forEach(ann => {
                notifications.push({
                    id: notifId++,
                    message: `CIE-${ann.cieNumber} for ${ann.Subject ? ann.Subject.name : 'Unknown'} is scheduled on ${ann.scheduledDate}`,
                    type: 'EXAM_SCHEDULE',
                    isRead: false,
                    createdAt: ann.createdAt || new Date()
                });
            });
        }

        // 2. Get Marks Uploaded Notifications
        const studentMarks = await CIEMark.findAll({
            where: { studentId: student.id },
            include: [
                { model: Subject, as: 'subject', attributes: ['name', 'code', 'id'] }
            ],
            order: [['id', 'DESC']], // Use id as fallback for recent changes since timestamps are disabled
            limit: 10
        });

        if (studentMarks && studentMarks.length > 0) {
            const subjectSet = new Set();
            studentMarks.forEach(mark => {
                // Generate a notification for each recent mark update or unique subject entry
                // Simplification: identifying unique updates might require better audit logs. 
                // For now, we notify about the existence of marks.
                if (mark.subject && !subjectSet.has(`${mark.subject.id}-${mark.cieType}`)) {
                    subjectSet.add(`${mark.subject.id}-${mark.cieType}`);
                    notifications.push({
                        id: notifId++,
                        message: `${mark.cieType} marks for ${mark.subject.name} have been updated`,
                        type: 'MARKS_UPDATE',
                        isRead: false,
                        createdAt: mark.updatedAt || new Date()
                    });
                }
            });
        }


        // 3. Get General Notifications (HOD/Faculty Messages)
        const generalNotifications = await Notification.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.id }, // Corrected: Use User.id (from token) as Notifications are linked to User table
                    { category: 'BROADCAST' } // Global/Department Broadcasts
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        generalNotifications.forEach(n => {
            notifications.push({
                id: notifId++,
                message: n.message,
                type: n.type === 'ALERT' ? 'ALERT' : 'INFO', // Map to frontend types
                isRead: n.isRead,
                createdAt: n.createdAt
            });
        });



        // Sort by date descending
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
// Get Faculty Notifications
router.get('/faculty/notifications', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { limit = 20 } = req.query;

        const notifications = [];
        let notifId = 1;

        // 1. Get CIE Schedule Notifications (Announcements)
        // Fetch announcements for subjects in the faculty's department (or all for now)
        // Ideally we filter by subjects the faculty teaches, but for now showing all scheduled is safer visibility.
        const announcements = await Announcement.findAll({
            where: { status: 'SCHEDULED' },
            include: [{ model: Subject, attributes: ['name', 'code'] }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        announcements.forEach(ann => {
            notifications.push({
                id: notifId++,
                message: `CIE-${ann.cieNumber} for ${ann.Subject ? ann.Subject.name : 'Unknown'} is scheduled on ${ann.scheduledDate}`,
                type: 'INFO', // 'info' maps to Bell icon in frontend
                category: 'EXAM SCHEDULE',
                isRead: false,
                createdAt: ann.createdAt || new Date()
            });
        });

        // 2. Get Standard Notifications
        const dbNotifications = await Notification.findAll({
            where: { userId: facultyId },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        dbNotifications.forEach(n => {
            notifications.push({
                id: notifId++, // Re-indexing to avoid collisions if necessary, or use UUIDs in real app
                message: n.message,
                type: n.type === 'ALERT' ? 'ALERT' : 'INFO',
                category: 'GENERAL',
                isRead: n.isRead,
                createdAt: n.createdAt
            });
        });

        // Sort combined list
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
