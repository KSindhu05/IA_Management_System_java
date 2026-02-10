const express = require('express');
const router = express.Router();
const { Subject, CIEMark, Student } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');

// Get department analytics
router.get('/department/:dept/stats', authMiddleware, async (req, res) => {
    try {
        const { dept } = req.params;

        // Fetch all marks for the department
        // We need to join with Subject to filter by department
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
                atRiskCount: 0
            });
        }

        let totalMarks = 0;
        let passedCount = 0;
        let atRiskCount = 0;
        const PASS_THRESHOLD = 20; // Assuming 20/50 is pass
        const RISK_THRESHOLD = 18; // Below 18 is at risk

        marks.forEach(mark => {
            const score = mark.marks || 0;
            totalMarks += score;

            if (score >= PASS_THRESHOLD) {
                passedCount++;
            }

            if (score < RISK_THRESHOLD) {
                atRiskCount++;
            }
        });

        const average = (totalMarks / marks.length).toFixed(1);
        const passPercentage = ((passedCount / marks.length) * 100).toFixed(1);
        const atRiskPercentage = ((atRiskCount / marks.length) * 100).toFixed(1);

        res.json({
            average: parseFloat(average),
            passPercentage: parseFloat(passPercentage),
            atRiskCount,
            atRiskPercentage: parseFloat(atRiskPercentage)
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get department performance summary (mock/calculated)
router.get('/department/:dept', authMiddleware, async (req, res) => {
    try {
        const { dept } = req.params;
        // This endpoint seems to be a duplicate or slightly different view of stats.
        // For now, redirecting to stats logic or providing a simple success response
        // to prevent 404 errors until specific requirements are clarified.
        // HODDashboard calls this.

        res.json({
            department: dept,
            status: 'active',
            message: 'Department analytics ready'
        });
    } catch (error) {
        console.error('Department info error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
