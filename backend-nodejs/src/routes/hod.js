const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { User, Subject, CIEMark, Student, Attendance, Announcement, Notification, Resource } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// HOD dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('HOD'), (req, res) => {
    res.json({
        message: 'HOD dashboard',
        user: req.user
    });
});

// HOD Overview - Real data for overview tab
router.get('/overview', authMiddleware, roleMiddleware('HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { department } = req.query;
        const dept = department || 'CS';

        // 1. Get all marks for this department with student + subject info
        const marks = await CIEMark.findAll({
            include: [
                { model: Subject, as: 'subject', where: { department: dept } },
                { model: Student, as: 'student' }
            ]
        });

        // 2. Compute Grade Distribution from marks
        let gradeA = 0, gradeB = 0, gradeC = 0, gradeD = 0, gradeF = 0;
        marks.forEach(m => {
            const score = m.marks || 0;
            const maxMarks = m.maxMarks || 50;
            const percent = (score / maxMarks) * 100;
            if (percent >= 80) gradeA++;
            else if (percent >= 60) gradeB++;
            else if (percent >= 40) gradeC++;
            else if (percent >= 20) gradeD++;
            else gradeF++;
        });

        const gradeDistribution = {
            labels: ['A (80%+)', 'B (60-79%)', 'C (40-59%)', 'D (20-39%)', 'F (<20%)'],
            data: [gradeA, gradeB, gradeC, gradeD, gradeF]
        };

        // 3. Generate real alerts from data
        const alerts = [];
        let alertId = 1;

        // Find students with very low marks (at-risk)
        const studentMarksMap = {};
        marks.forEach(m => {
            const key = m.studentId;
            if (!studentMarksMap[key]) {
                studentMarksMap[key] = { student: m.student, scores: [], subjects: new Set() };
            }
            studentMarksMap[key].scores.push(m.marks || 0);
            if (m.subject) studentMarksMap[key].subjects.add(m.subject.name);
        });

        let atRiskCount = 0;
        Object.values(studentMarksMap).forEach(entry => {
            const avg = entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
            if (avg < 18 && entry.student) {
                atRiskCount++;
                if (alerts.length < 5) {
                    alerts.push({
                        id: alertId++,
                        type: 'warning',
                        message: `${entry.student.name} has low average (${avg.toFixed(1)}/50)`,
                        date: new Date().toLocaleDateString()
                    });
                }
            }
        });

        if (atRiskCount > 5) {
            alerts.unshift({
                id: alertId++,
                type: 'critical',
                message: `${atRiskCount} students are at risk with below-threshold marks`,
                date: new Date().toLocaleDateString()
            });
        }

        // Check for subjects with poor overall performance
        const subjectPerf = {};
        marks.forEach(m => {
            if (!m.subject) return;
            const name = m.subject.name;
            if (!subjectPerf[name]) subjectPerf[name] = { total: 0, count: 0 };
            subjectPerf[name].total += (m.marks || 0);
            subjectPerf[name].count++;
        });

        Object.entries(subjectPerf).forEach(([name, data]) => {
            const avg = data.total / data.count;
            if (avg < 25) {
                alerts.push({
                    id: alertId++,
                    type: 'warning',
                    message: `${name} has low class average (${avg.toFixed(1)}/50)`,
                    date: new Date().toLocaleDateString()
                });
            }
        });

        // Pending submissions alert
        const pendingCount = marks.filter(m => m.status === 'PENDING').length;
        if (pendingCount > 0) {
            alerts.push({
                id: alertId++,
                type: 'info',
                message: `${pendingCount} mark entries are still pending review`,
                date: new Date().toLocaleDateString()
            });
        }

        // If no alerts, add a positive one
        if (alerts.length === 0) {
            alerts.push({
                id: 1,
                type: 'info',
                message: 'All department metrics are within acceptable range',
                date: new Date().toLocaleDateString()
            });
        }

        // 4. Compute CIE Trend (Averages per CIE round)
        const cieStats = {
            'CIE1': { total: 0, count: 0 },
            'CIE2': { total: 0, count: 0 },
            'CIE3': { total: 0, count: 0 },
            'CIE4': { total: 0, count: 0 },
            'CIE5': { total: 0, count: 0 }
        };

        marks.forEach(m => {
            const type = (m.cieType || m.cie_type || '').toUpperCase();
            let target = null;
            if (cieStats[type]) target = type;
            else if (type.includes('1')) target = 'CIE1';
            else if (type.includes('2')) target = 'CIE2';
            else if (type.includes('3')) target = 'CIE3';
            else if (type.includes('4')) target = 'CIE4';
            else if (type.includes('5')) target = 'CIE5';

            if (target) {
                cieStats[target].total += (m.marks || 0);
                cieStats[target].count++;
            }
        });

        const cieTrend = {};
        Object.keys(cieStats).forEach(key => {
            cieTrend[key] = cieStats[key].count > 0
                ? parseFloat((cieStats[key].total / cieStats[key].count).toFixed(1))
                : 0;
        });

        // 5. Compute Subject-wise Performance
        const subjects = await Subject.findAll({ where: { department: dept } });
        const subjectPerfList = subjects.map(s => {
            const sMarks = marks.filter(m => m.subjectId === s.id);
            const sStats = { 'CIE1': { t: 0, c: 0 }, 'CIE2': { t: 0, c: 0 }, 'CIE3': { t: 0, c: 0 }, 'CIE4': { t: 0, c: 0 }, 'CIE5': { t: 0, c: 0 } };

            sMarks.forEach(m => {
                const type = (m.cieType || m.cie_type || '').toUpperCase();
                let target = null;
                if (sStats[type]) target = type;
                else if (type.includes('1')) target = 'CIE1';
                else if (type.includes('2')) target = 'CIE2';
                else if (type.includes('3')) target = 'CIE3';
                else if (type.includes('4')) target = 'CIE4';
                else if (type.includes('5')) target = 'CIE5';
                if (target) { sStats[target].t += (m.marks || 0); sStats[target].c++; }
            });

            const averages = {};
            let gTotal = 0, gCount = 0;
            Object.keys(sStats).forEach(k => {
                const avg = sStats[k].c > 0 ? parseFloat((sStats[k].t / sStats[k].c).toFixed(1)) : 0;
                averages[k] = avg;
                if (avg > 0) { gTotal += avg; gCount++; }
            });
            const overall = gCount > 0 ? parseFloat((gTotal / gCount).toFixed(1)) : 0;
            return { id: s.id, name: s.name, averages, overall, passRate: Math.min(100, Math.round((overall / 50) * 100)) };
        });

        // 6. Faculty count
        const facultyCount = await User.count({ where: { role: 'FACULTY', department: dept } });

        res.json({
            gradeDistribution,
            alerts,
            facultyCount,
            cieTrend,
            subjectPerfList
        });

    } catch (error) {
        console.error('HOD overview error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Faculty List (with optional department filter)
router.get('/faculty', authMiddleware, roleMiddleware('HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const { department } = req.query;
        const whereClause = { role: 'FACULTY' };
        if (department) {
            whereClause.department = department;
        }

        const faculty = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'fullName', 'email', 'department']
        });

        // Enhance with subjects mapping
        const formatted = await Promise.all(faculty.map(async f => {
            const subjects = await Subject.findAll({ where: { instructorId: f.id } });
            return {
                id: f.id,
                username: f.username,
                fullName: f.fullName || f.username,
                department: f.department || 'General',
                designation: 'Faculty',
                semester: f.semester,
                section: f.section,
                subjects: subjects.map(s => s.name)
            };
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get faculty error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add Faculty
router.post('/faculty', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { username, fullName, email, password, department, designation, subjects, semester, section } = req.body;

        // Check if user already exists
        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password || 'password123', 10);

        const newFaculty = await User.create({
            username,
            fullName,
            email,
            password: hashedPassword,
            role: 'FACULTY',
            department,
            associatedId: username,
            semester,
            section
        });

        // Assign subjects if provided
        if (subjects && Array.isArray(subjects)) {
            for (const subName of subjects) {
                // Find subject by name in the same department
                await Subject.update(
                    { instructorId: newFaculty.id.toString(), instructorName: fullName || username },
                    {
                        where: {
                            [Op.and]: [
                                sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), sequelize.fn('LOWER', subName)),
                                { department: department }
                            ]
                        }
                    }
                );
            }
        }

        res.status(201).json({ message: 'Faculty created successfully', id: newFaculty.id });
    } catch (error) {
        console.error('Add faculty error:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// Update Faculty
router.put('/faculty/:id', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, designation, subjects, department, semester, section } = req.body;

        const faculty = await User.findByPk(id);
        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

        // Update basic info
        await faculty.update({
            fullName: fullName || faculty.fullName,
            email: email || faculty.email,
            designation: designation || faculty.designation,
            semester: semester !== undefined ? semester : faculty.semester,
            section: section !== undefined ? section : faculty.section
        });

        // Update subjects assignment
        if (subjects && Array.isArray(subjects)) {
            // 1. Clear previous assignments for this instructor
            await Subject.update(
                { instructorId: null, instructorName: null },
                { where: { instructorId: id.toString() } }
            );

            // 2. Assign new subjects
            for (const subName of subjects) {
                await Subject.update(
                    { instructorId: id.toString(), instructorName: fullName || faculty.username },
                    {
                        where: {
                            [Op.and]: [
                                sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), sequelize.fn('LOWER', subName)),
                                { department: department || faculty.department }
                            ]
                        }
                    }
                );
            }
        }

        res.json({ message: 'Faculty updated successfully' });
    } catch (error) {
        console.error('Update faculty error:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Validation error',
                details: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// Delete Faculty
router.delete('/faculty/:id', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        console.log(`[HOD DELETION] Attempting to remove faculty ID: ${id}`);

        // 1. Check if faculty exists
        const faculty = await User.findByPk(id);
        if (!faculty) {
            console.log(`[HOD DELETION] Faculty not found for ID: ${id}`);
            await t.rollback();
            return res.status(404).json({ message: 'Faculty not found' });
        }

        // 2. Clear instructor from assigned subjects
        await Subject.update(
            { instructorId: null, instructorName: null },
            { where: { instructorId: id.toString() }, transaction: t }
        );

        // 3. Cleanup Attendance
        await Attendance.update(
            { facultyId: null },
            { where: { facultyId: id }, transaction: t }
        );

        // 4. Cleanup Announcements
        await Announcement.update(
            { facultyId: null },
            { where: { facultyId: id }, transaction: t }
        );

        // 5. Cleanup Resources
        await Resource.update(
            { uploadedBy: null },
            { where: { uploadedBy: id }, transaction: t }
        );

        // 6. Delete User's Notifications
        await Notification.destroy({
            where: { userId: id },
            transaction: t
        });

        // 7. Finally Delete the User record
        await faculty.destroy({ transaction: t });

        await t.commit();
        console.log(`[HOD DELETION] SUCCESS: Faculty ${id} removed`);
        res.json({ message: 'Faculty removed successfully' });
    } catch (error) {
        await t.rollback();
        console.error('[HOD DELETION] ERROR:', error);

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(500).json({
                message: 'Database Link Error: This faculty is connected to other records.',
                details: error.parent.message,
                table: error.table
            });
        }
        res.status(500).json({
            message: 'Error removing faculty: ' + error.message,
            error: error.name,
            details: error.parent ? error.parent.message : error.message
        });
    }
});

module.exports = router;

