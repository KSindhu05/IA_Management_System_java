const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { Student, CIEMark, Subject } = require('../models');

// Student dashboard
router.get('/dashboard', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { regNo: req.user.username },
            include: [
                {
                    model: CIEMark,
                    as: 'marks',
                    include: [{ model: Subject, as: 'subject' }]
                }
            ]
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({
            student: {
                id: student.id,
                regNo: student.regNo,
                name: student.name,
                department: student.department,
                semester: student.semester,
                section: student.section
            },
            marks: student.marks || []
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
