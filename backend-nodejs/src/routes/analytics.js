const express = require('express');
const router = express.Router();
const { Subject, CIEMark, Student } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');

router.get('/ping', (req, res) => res.json({ message: 'analytics-ok' }));

// Get department analytics (per-student basis)
router.get('/department/:dept/stats', authMiddleware, async (req, res) => {
    try {
        const { dept } = req.params;

        // Fetch all marks for the department
        const marks = await CIEMark.findAll({
            include: [{
                model: Subject,
                as: 'subject',
                where: { department: dept }
            }]
        });

        if (marks.length === 0) {
            return res.json({
                average: 0,
                passPercentage: 0,
                atRiskCount: 0,
                totalStudents: 0
            });
        }

        // Aggregate marks by student
        const studentMarks = {};
        marks.forEach(mark => {
            const sid = mark.studentId;
            if (!studentMarks[sid]) {
                studentMarks[sid] = { total: 0, count: 0 };
            }
            studentMarks[sid].total += (mark.marks || 0);
            studentMarks[sid].count++;
        });

        const PASS_THRESHOLD = 20; // Average >= 20/50 is pass
        const RISK_THRESHOLD = 18; // Average < 18/50 is at-risk

        let totalAvg = 0;
        let passedStudents = 0;
        let atRiskStudents = 0;
        const studentIds = Object.keys(studentMarks);
        const totalStudents = studentIds.length;

        studentIds.forEach(sid => {
            const avg = studentMarks[sid].total / studentMarks[sid].count;
            totalAvg += avg;

            if (avg >= PASS_THRESHOLD) {
                passedStudents++;
            }
            if (avg < RISK_THRESHOLD) {
                atRiskStudents++;
            }
        });

        const departmentAverage = totalStudents > 0 ? (totalAvg / totalStudents).toFixed(1) : 0;
        const passPercentage = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0;

        res.json({
            average: parseFloat(departmentAverage),
            passPercentage: parseFloat(passPercentage),
            atRiskCount: atRiskStudents,
            totalStudents
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get department-wide CIE averages (trend)
router.get('/department/:dept/cie-trend', authMiddleware, async (req, res) => {
    try {
        const { dept } = req.params;
        console.log(`Fetching trend for dept: ${dept}`);
        const marks = await CIEMark.findAll({
            include: [{
                model: Subject,
                as: 'subject',
                where: { department: dept }
            }]
        });

        console.log(`Found ${marks.length} marks for trend calculation`);

        const stats = {
            'CIE1': { total: 0, count: 0 },
            'CIE2': { total: 0, count: 0 },
            'CIE3': { total: 0, count: 0 },
            'CIE4': { total: 0, count: 0 },
            'CIE5': { total: 0, count: 0 }
        };

        marks.forEach(m => {
            const type = (m.cieType || m.cie_type || '').toUpperCase();
            if (stats[type]) {
                const val = parseFloat(m.marks) || 0;
                stats[type].total += val;
                stats[type].count++;
            } else if (type.includes('1')) { stats['CIE1'].total += (parseFloat(m.marks) || 0); stats['CIE1'].count++; }
            else if (type.includes('2')) { stats['CIE2'].total += (parseFloat(m.marks) || 0); stats['CIE2'].count++; }
            else if (type.includes('3')) { stats['CIE3'].total += (parseFloat(m.marks) || 0); stats['CIE3'].count++; }
            else if (type.includes('4')) { stats['CIE4'].total += (parseFloat(m.marks) || 0); stats['CIE4'].count++; }
            else if (type.includes('5')) { stats['CIE5'].total += (parseFloat(m.marks) || 0); stats['CIE5'].count++; }
        });

        const averages = {};
        Object.keys(stats).forEach(type => {
            averages[type] = stats[type].count > 0
                ? parseFloat((stats[type].total / stats[type].count).toFixed(1))
                : 0;
        });

        console.log('Calculated averages:', averages);
        res.json({ averages });
    } catch (error) {
        console.error('Dept trend error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get comprehensive subject-wise performance for a department
router.get('/department/:dept/subject-performance', authMiddleware, async (req, res) => {
    try {
        const { dept } = req.params;
        const subjects = await Subject.findAll({ where: { department: dept } });
        const subjectIds = subjects.map(s => s.id);

        const marks = await CIEMark.findAll({
            where: { subjectId: { [Op.in]: subjectIds } }
        });

        const perfData = {};
        subjects.forEach(s => {
            perfData[s.id] = {
                id: s.id,
                name: s.name,
                cieStats: {
                    'CIE1': { total: 0, count: 0 },
                    'CIE2': { total: 0, count: 0 },
                    'CIE3': { total: 0, count: 0 },
                    'CIE4': { total: 0, count: 0 },
                    'CIE5': { total: 0, count: 0 }
                }
            };
        });

        marks.forEach(m => {
            if (perfData[m.subjectId]) {
                const type = (m.cieType || m.cie_type || '').toUpperCase();
                let targetType = null;
                if (perfData[m.subjectId].cieStats[type]) targetType = type;
                else if (type.includes('1')) targetType = 'CIE1';
                else if (type.includes('2')) targetType = 'CIE2';
                else if (type.includes('3')) targetType = 'CIE3';
                else if (type.includes('4')) targetType = 'CIE4';
                else if (type.includes('5')) targetType = 'CIE5';

                if (targetType) {
                    const val = parseFloat(m.marks) || 0;
                    perfData[m.subjectId].cieStats[targetType].total += val;
                    perfData[m.subjectId].cieStats[targetType].count++;
                }
            }
        });

        const result = Object.values(perfData).map(item => {
            const averages = {};
            let grandTotal = 0;
            let grandCount = 0;
            Object.keys(item.cieStats).forEach(type => {
                const avg = item.cieStats[type].count > 0
                    ? parseFloat((item.cieStats[type].total / item.cieStats[type].count).toFixed(1))
                    : 0;
                averages[type] = avg;
                if (avg > 0) {
                    grandTotal += avg;
                    grandCount++;
                }
            });
            const overall = grandCount > 0 ? parseFloat((grandTotal / grandCount).toFixed(1)) : 0;
            const passRate = overall > 0 ? Math.min(100, Math.round((overall / 50) * 100)) : 0;

            return {
                id: item.id,
                name: item.name,
                averages,
                overall,
                passRate
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Subject performance list error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get subject-specific CIE averages
router.get('/subject/:subjectId/stats', authMiddleware, async (req, res) => {
    try {
        const { subjectId } = req.params;

        // Fetch all marks for this subject
        const marks = await CIEMark.findAll({
            where: { subjectId },
            attributes: ['marks', 'cieType']
        });

        if (marks.length === 0) {
            return res.json({
                averages: {
                    'CIE1': 0,
                    'CIE2': 0,
                    'CIE3': 0,
                    'CIE4': 0,
                    'CIE5': 0
                }
            });
        }

        // Group by cieType and calculate averages
        const stats = {
            'CIE1': { total: 0, count: 0 },
            'CIE2': { total: 0, count: 0 },
            'CIE3': { total: 0, count: 0 },
            'CIE4': { total: 0, count: 0 },
            'CIE5': { total: 0, count: 0 }
        };

        marks.forEach(m => {
            if (stats[m.cieType]) {
                const val = parseFloat(m.marks) || 0;
                stats[m.cieType].total += val;
                stats[m.cieType].count++;
            }
        });

        const averages = {};
        Object.keys(stats).forEach(type => {
            averages[type] = stats[type].count > 0
                ? parseFloat((stats[type].total / stats[type].count).toFixed(1))
                : 0;
        });

        res.json({ averages });

    } catch (error) {
        console.error('Subject analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
