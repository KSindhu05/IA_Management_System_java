const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Faculty dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('FACULTY'), (req, res) => {
    res.json({
        message: 'Faculty dashboard',
        user: req.user
    });
});

module.exports = router;
