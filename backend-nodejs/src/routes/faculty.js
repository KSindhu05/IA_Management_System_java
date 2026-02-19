const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Subject } = require('../models');

// Faculty dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('FACULTY'), (req, res) => {
    res.json({
        message: 'Faculty dashboard',
        user: req.user
    });
});

// Get Faculty Assigned Subjects
router.get('/my-subjects', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        // Find subjects where instructorId matches user id
        // Note: instructorId in Subject model is STRING, user.id is BIGINT/INTEGER
        // We cast user.id to string to be safe
        const subjects = await Subject.findAll({
            where: { instructorId: String(req.user.id) }
        });
        res.json(subjects);
    } catch (error) {
        console.error('Get my-subjects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Faculty Analytics (Real Data)
router.get('/analytics', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        // 1. Get Subjects for this faculty
        const subjects = await Subject.findAll({
            where: { instructorId: String(req.user.id) }
        });

        if (subjects.length === 0) {
            return res.json({
                totalStudents: 0,
                evaluated: 0,
                pending: 0,
                avgScore: 0,
                lowPerformers: 0,
                topPerformers: 0
            });
        }

        const subjectIds = subjects.map(s => s.id);

        // 2. Calculate Total Students (Sum of class sizes)
        let totalStudents = 0;
        // We need to count students for each subject based on Dept + Sem
        // To avoid N+1, we can group by dept, sem?
        // Simpler iteration for now (N is small, typically < 5 subjects)
        for (const sub of subjects) {
            const count = await require('../models/Student').count({
                where: {
                    department: sub.department,
                    semester: sub.semester
                }
            });
            totalStudents += count;
        }

        // 3. Get Marks for these subjects
        const { Op } = require('sequelize');
        const CIEMark = require('../models/CIEMark');

        const allMarks = await CIEMark.findAll({
            where: {
                subjectId: { [Op.in]: subjectIds }
            }
        });

        // 4. Calculate Evaluated (Unique Student-Subject pairs with marks)
        // A student might have multiple CIEs; we count the student once per subject if ANY mark exists
        const evaluatedSet = new Set();
        allMarks.forEach(m => evaluatedSet.add(`${m.studentId}-${m.subjectId}`));
        const evaluated = evaluatedSet.size;

        const pending = Math.max(0, totalStudents - evaluated);

        // 5. Calculate Average Score & Performers
        let totalPercentage = 0;
        let countMarks = 0;
        let lowPerformers = 0;
        let topPerformers = 0;

        allMarks.forEach(m => {
            if (m.maxMarks > 0) {
                const pct = (m.marks / m.maxMarks) * 100;
                totalPercentage += pct;
                countMarks++;

                // Per-assessment performance tracking
                if (pct < 40) lowPerformers++;
                if (pct >= 80) topPerformers++;
            }
        });

        const avgScore = countMarks > 0 ? Math.round(totalPercentage / countMarks) : 0;

        // 6. Get List of Low Performers (Marks < 20 and > 0 to avoid unentered/future exams)
        console.log(`Searching low performers (0 < marks < 20) for subjects: ${subjectIds.join(', ')}`);
        const lowPerformerMarks = await CIEMark.findAll({
            where: {
                subjectId: { [Op.in]: subjectIds },
                marks: {
                    [Op.lt]: 20,
                    [Op.gt]: 0
                }
            },
            include: [
                { model: require('../models/Student'), as: 'student', attributes: ['name', 'regNo', 'department', 'semester'] },
                { model: Subject, as: 'subject', attributes: ['name', 'code'] }
            ],
            limit: 100,
            order: [['marks', 'ASC']]
        });
        console.log(`Found ${lowPerformerMarks.length} low performers`);

        const lowPerformersList = lowPerformerMarks.map(m => ({
            name: m.student?.name || 'Unknown',
            regNo: m.student?.regNo,
            subject: m.subject?.name || 'Unknown',
            score: m.marks,
            cieType: m.cieType // Added cieType
        }));

        res.json({
            evaluated, // "Evaluated" count
            pending,   // "Pending" count
            totalStudents, // "Total Students"
            avgScore,
            lowPerformers,
            topPerformers,
            start: "Deadline: Nov 10, 2025",
            lowPerformersList // Data for Action Required table
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
