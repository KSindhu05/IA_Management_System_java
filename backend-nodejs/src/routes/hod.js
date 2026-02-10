const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { User, Subject } = require('../models');

const bcrypt = require('bcryptjs');

// HOD dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('HOD'), (req, res) => {
    res.json({
        message: 'HOD dashboard',
        user: req.user
    });
});

// Add New Faculty
router.post('/faculty', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { username, email, password, department, designation } = req.body;

        if (!username || !email || !password || !department) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newFaculty = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'FACULTY',
            department,
            fullName: username, // Default to username if no full name provided
            designation: designation || 'Assistant Professor'
        });

        res.status(201).json({ message: 'Faculty added successfully', faculty: newFaculty });

    } catch (error) {
        console.error('Add faculty error:', error);
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
            attributes: ['id', 'username', 'email', 'department']
        });

        // Enhance with subjects mapping
        const formatted = await Promise.all(faculty.map(async f => {
            const subjects = await Subject.findAll({ where: { instructorId: f.id } });
            return {
                id: f.id,
                username: f.username,
                fullName: f.username, // Using username as name if no fullName field
                department: f.department || 'General',
                designation: 'Faculty', // Placeholder
                subjects: subjects.map(s => s.name)
            };
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get faculty error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
