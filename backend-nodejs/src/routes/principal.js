const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Principal dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('PRINCIPAL'), (req, res) => {
    res.json({
        message: 'Principal dashboard',
        user: req.user
    });
});

module.exports = router;
