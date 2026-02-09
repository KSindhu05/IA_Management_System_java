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

// Get subject by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        console.error('Get subject by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
