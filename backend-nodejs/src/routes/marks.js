const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { CIEMark, Student, Subject, User } = require('../models');

// Get my marks (for students)
router.get('/my-marks', authMiddleware, roleMiddleware('STUDENT'), async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { regNo: req.user.username },
            include: [{
                model: User,
                as: 'user'
            }]
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const marks = await CIEMark.findAll({
            where: {
                studentId: student.id,
                status: 'APPROVED'
            },
            include: [{
                model: Subject,
                as: 'subject'
            }]
        });

        // Format data to match frontend expectations
        const formattedMarks = marks.map(mark => ({
            id: mark.id,
            cieType: mark.cieType || 'CIE1',
            totalScore: mark.marks,
            attendancePercentage: mark.attendance,
            student: {
                id: student.id,
                regNo: student.regNo,
                name: student.name,
                department: student.department,
                semester: student.semester
            },
            subject: {
                id: mark.subject.id,
                name: mark.subject.name,
                code: mark.subject.code,
                department: mark.subject.department,
                semester: mark.subject.semester,
                maxMarks: mark.maxMarks
            }
        }));

        res.json(formattedMarks);
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get marks for a subject (faculty/HOD)
router.get('/subject/:subjectId', authMiddleware, roleMiddleware('FACULTY', 'HOD'), async (req, res) => {
    try {
        const marks = await CIEMark.findAll({
            where: { subjectId: req.params.subjectId },
            include: [
                { model: Student, as: 'student' },
                { model: Subject, as: 'subject' }
            ]
        });

        // Backend-Node model uses 'marks', Java used 'totalScore'.
        // We'll map it here for compatibility or rely on frontend change.
        // Let's map it.
        const compatibleMarks = marks.map(m => ({
            ...m.toJSON(),
            totalScore: m.marks,
            iaType: m.cieType // Alias
        }));

        res.json(compatibleMarks);
    } catch (error) {
        console.error('Get subject marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update marks (faculty) - Single Update
router.post('/update', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const { id, marks, maxMarks, attendance } = req.body;

        const cieMark = await CIEMark.findByPk(id);
        if (!cieMark) {
            return res.status(404).json({ message: 'Mark record not found' });
        }

        await cieMark.update({ marks, maxMarks, attendance, status: 'PENDING' });

        res.json({ message: 'Marks updated successfully', mark: cieMark });
    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Batch Update Marks
router.post('/update/batch', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const payload = req.body; // Expect array of { studentId, subjectId, iaType, co1, co2 }

        if (!Array.isArray(payload) || payload.length === 0) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        const updates = [];

        for (const entry of payload) {
            const { studentId, subjectId, iaType, co1 } = entry;
            // iaType comes as CIE1, CIE2 etc.

            // Check if exists
            let markRecord = await CIEMark.findOne({
                where: {
                    studentId: studentId,
                    subjectId: subjectId,
                    cieType: iaType // Filter by Type!
                }
            });

            if (markRecord) {
                // Determine if we are allowed to update (Lock check)
                if (markRecord.status === 'SUBMITTED' || markRecord.status === 'APPROVED') {
                    continue; // Skip locked records
                }

                await markRecord.update({
                    marks: co1 || 0,
                    status: 'PENDING' // Reset to PENDING on edit
                });
                updates.push(markRecord.id);
            } else {
                // Create new
                const newMark = await CIEMark.create({
                    studentId,
                    subjectId,
                    marks: co1 || 0,
                    maxMarks: 50,
                    attendance: 0,
                    status: 'PENDING',
                    cieType: iaType
                });
                updates.push(newMark.id);
            }
        }

        res.json({ message: 'Batch update successful', updatedCount: updates.length });
    } catch (error) {
        console.error('Batch update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Submit Marks to HOD
router.post('/submit', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const { subjectId, cieType } = req.query; // Query params: ?subjectId=1&cieType=CIE1

        if (!subjectId) {
            return res.status(400).json({ message: 'Subject ID required' });
        }

        // Update all marks for this subject AND cieType to SUBMITTED
        const whereClause = {
            subjectId: subjectId,
            status: ['PENDING', 'REJECTED']
        };

        // If cieType is provided, filter by it.
        if (cieType) {
            whereClause.cieType = cieType;
        }

        const [updatedRows] = await CIEMark.update(
            { status: 'SUBMITTED' },
            { where: whereClause }
        );

        if (updatedRows === 0) {
            return res.json({ message: 'No marks to submit or already submitted.' });
        }

        res.json({ message: 'Marks submitted to HOD successfully', count: updatedRows });
    } catch (error) {
        console.error('Submit marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Approve marks (HOD) - Bulk Approve by Subject & Type
router.post('/approve', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { subjectId, iaType } = req.query;

        if (!subjectId || !iaType) {
            return res.status(400).json({ message: 'Subject ID and IA Type required' });
        }

        const [updatedRows] = await CIEMark.update(
            { status: 'APPROVED' },
            {
                where: {
                    subjectId: subjectId,
                    cieType: iaType,
                    status: ['SUBMITTED']
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'No submitted marks found to approve' });
        }

        res.json({ message: 'Marks approved successfully', count: updatedRows });
    } catch (error) {
        console.error('Approve marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reject marks (HOD)
router.post('/reject', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { subjectId, iaType } = req.query;

        if (!subjectId || !iaType) {
            return res.status(400).json({ message: 'Subject ID and IA Type required' });
        }

        const [updatedRows] = await CIEMark.update(
            { status: 'REJECTED' },
            {
                where: {
                    subjectId: subjectId,
                    cieType: iaType,
                    status: ['SUBMITTED', 'APPROVED']
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'No marks found to reject' });
        }

        res.json({ message: 'Marks rejected successfully', count: updatedRows });
    } catch (error) {
        console.error('Reject marks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all students (for faculty/HOD)
router.get('/students', authMiddleware, roleMiddleware('FACULTY', 'HOD', 'PRINCIPAL'), async (req, res) => {
    try {
        const students = await Student.findAll({
            attributes: ['id', 'regNo', 'name', 'department', 'semester', 'section', 'phoneNo', 'email'],
            order: [['regNo', 'ASC']]
        });

        // Format for frontend
        const formatted = students.map(s => ({
            id: s.id,
            rollNo: s.regNo,
            name: s.name,
            section: s.section || 'A',
            batch: '2025-26',
            sem: s.semester || '2',
            semester: s.semester || '2',
            department: s.department || 'CS',
            attendance: 85, // Default, would come from attendance table
            phone: s.phoneNo
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get faculty subjects (for faculty)
// Get faculty subjects (for faculty)
router.get('/faculty/my-subjects', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const allSubjects = await Subject.findAll();
        // Count students per subject
        const studentCount = await Student.count();

        // Simple mapping based on Faculty Username
        // FAC001 -> Engineering Maths-II (Id: 5)
        // FAC002 -> English Communication (Id: 6)
        // FAC003 -> CAEG (Id: 7)
        // FAC004 -> Python (Id: 8)
        // FAC005 -> Data Structures (Id: 1)
        // Fallback: Return first subject if no match

        const username = req.user.username; // e.g., FAC001
        let assignedSubject = null;

        if (username === 'FAC001') assignedSubject = allSubjects.find(s => s.name.includes('Maths'));
        else if (username === 'FAC002') assignedSubject = allSubjects.find(s => s.name.includes('English'));
        else if (username === 'FAC003') assignedSubject = allSubjects.find(s => s.name.includes('CAEG'));
        else if (username === 'FAC004') assignedSubject = allSubjects.find(s => s.name.includes('Python'));
        else if (username === 'FAC005') assignedSubject = allSubjects.find(s => s.name.includes('Data Sources') || s.code === 'BCS301');

        // If specific mapping fails or for other faculty, assign using modulo
        if (!assignedSubject) {
            const facIndex = parseInt(username.replace(/\D/g, '')) || 1;
            assignedSubject = allSubjects[(facIndex - 1) % allSubjects.length];
        }

        const formatted = [{
            id: assignedSubject.id,
            name: assignedSubject.name,
            code: assignedSubject.code,
            semester: assignedSubject.semester || '2',
            instructorId: req.user.id,
            studentCount: studentCount
        }];

        res.json(formatted);
    } catch (error) {
        console.error('Get faculty subjects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get faculty analytics
router.get('/faculty/analytics', authMiddleware, roleMiddleware('FACULTY'), async (req, res) => {
    try {
        const allSubjects = await Subject.findAll();
        const username = req.user.username;
        let assignedSubject = null;

        // Same mapping logic as my-subjects
        if (username === 'FAC001') assignedSubject = allSubjects.find(s => s.name.includes('Maths'));
        else if (username === 'FAC002') assignedSubject = allSubjects.find(s => s.name.includes('English'));
        else if (username === 'FAC003') assignedSubject = allSubjects.find(s => s.name.includes('CAEG'));
        else if (username === 'FAC004') assignedSubject = allSubjects.find(s => s.name.includes('Python'));
        else if (username === 'FAC005') assignedSubject = allSubjects.find(s => s.name.includes('Data Sources') || s.code === 'BCS301');

        if (!assignedSubject) {
            const facIndex = parseInt(username.replace(/\D/g, '')) || 1;
            assignedSubject = allSubjects[(facIndex - 1) % allSubjects.length];
        }

        const totalStudents = await Student.count(); // Assuming all 63 students take the subject

        // Fetch marks for this subject
        const marks = await CIEMark.findAll({
            where: { subjectId: assignedSubject.id }
        });

        const evaluated = marks.length;
        const pending = totalStudents - evaluated;

        let totalScore = 0;
        let lowPerformers = 0;
        let topPerformers = 0;

        marks.forEach(m => {
            totalScore += m.marks;
            // Assuming max marks is usually 50 for CIE
            if (m.marks < 20) lowPerformers++; // < 40%
            if (m.marks >= 45) topPerformers++; // >= 90%
        });

        const avgScore = evaluated > 0 ? Math.round(totalScore / evaluated) : 0;

        res.json({
            evaluated,
            pending,
            avgScore,
            lowPerformers,
            topPerformers,
            subjectName: assignedSubject.name
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get pending approvals (HOD)
router.get('/pending', authMiddleware, roleMiddleware('HOD'), async (req, res) => {
    try {
        const { department } = req.query;

        // Fetch all marks with status 'SUBMITTED'
        const pendingMarks = await CIEMark.findAll({
            where: { status: 'SUBMITTED' },
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    where: department ? { department } : {}
                },
                {
                    model: Student,
                    as: 'student'
                }
            ]
        });

        // Group by Subject and CIE Type
        const grouped = {};
        pendingMarks.forEach(mark => {
            const key = `${mark.subjectId}-${mark.cieType}`;
            if (!grouped[key]) {
                grouped[key] = {
                    subjectId: mark.subjectId,
                    subjectName: mark.subject.name,
                    iaType: mark.cieType,
                    facultyName: 'Assigned Faculty', // Placeholder or derive if possible
                    studentCount: 0,
                    marks: []
                };
            }
            grouped[key].studentCount++;
            grouped[key].marks.push({
                studentId: mark.studentId,
                studentName: mark.student.name,
                regNo: mark.student.regNo,
                totalScore: mark.marks
            });
        });

        res.json(Object.values(grouped));
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
