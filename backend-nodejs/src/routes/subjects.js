const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Subject } = require('../models');

// Get subjects by department
router.get('/department/:department', authMiddleware, async (req, res) => {
    try {
        const subjects = await Subject.findAll({
            where: { department: req.params.department }
        });

        res.json(subjects);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all subjects
router.get('/', authMiddleware, async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        res.json(subjects);
    } catch (error) {
        console.error('Get all subjects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
