const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = verifyToken(token);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    roleMiddleware
};
