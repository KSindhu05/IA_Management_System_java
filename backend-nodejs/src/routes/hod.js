const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// HOD dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('HOD'), (req, res) => {
    res.json({
        message: 'HOD dashboard',
        user: req.user
    });
});

module.exports = router;
