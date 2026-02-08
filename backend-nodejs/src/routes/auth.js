const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: 'Auth Failed: Bad credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Auth Failed: Bad credentials' });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            token,
            id: user.id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Health check
router.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Register endpoint (for admin use)
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, associatedId, department, fullName, email } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            password: hashedPassword,
            role,
            associatedId,
            department,
            fullName,
            email
        });

        res.status(201).json({
            message: 'User created successfully',
            userId: user.id
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
