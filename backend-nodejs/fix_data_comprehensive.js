const sequelize = require('./src/config/database');
const { Student, Subject, CIEMark } = require('./src/models');
const { Op } = require('sequelize');

async function fixData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Fix Student Semesters
        const students = await Student.findAll({ where: { department: 'Computer Science & Engineering' } });
        console.log(`Found ${students.length} CS Students.`);

        // Update semester to '2' if missing or not '2'
        await Student.update(
            { semester: '2' },
            { where: { department: 'Computer Science & Engineering' } }
        );
        console.log('Updated all CS students to Semester 2.');

        // 2. Re-seed Marks for correct student IDs
        const subjectsToCheck = [
            'Engineering Maths-II',
            'English Communication',
            'Computer Aided Engineering Graphics',
            'Python Programming'
        ];

        for (const subName of subjectsToCheck) {
            // Use broader search for Python
            const searchName = subName === 'Python Programming' ? 'Python' : subName;
            let subject = await Subject.findOne({ where: { name: { [Op.like]: `%${searchName}%` } } });

            if (!subject) {
                console.log(`Subject ${subName} (searched '${searchName}') NOT FOUND. Skipping.`);
                continue;
            }
            console.log(`Processing ${subject.name} (ID: ${subject.id})...`);

            // Delete existing marks for this subject (safest way to ensure no ID mismatch)
            await CIEMark.destroy({ where: { subjectId: subject.id } });
            console.log(`  Cleared old marks.`);

            // Create new marks for all current students
            const newMarks = students.map(student => ({
                studentId: student.id,
                subjectId: subject.id,
                cieType: 'CIE1',
                marks: Math.floor(Math.random() * (48 - 30 + 1)) + 30, // Random 30-48
                maxMarks: 50,
                attendance: Math.floor(Math.random() * (100 - 75 + 1)) + 75,
                status: 'PENDING' // Set to PENDING to be easily editable
            }));

            // Also add CIE-2 marks (some pending)
            const cie2Marks = students.map(student => ({
                studentId: student.id,
                subjectId: subject.id,
                cieType: 'CIE2',
                marks: 0, // Not yet evaluated
                maxMarks: 50,
                attendance: 0,
                status: 'PENDING'
            }));

            // Actually, HOD sees "Approved" marks in "Update Marks" if checking history?
            // User just wants "CIE-1 data".
            // I'll insert CIE1.

            await CIEMark.bulkCreate(newMarks);
            console.log(`  Seeded ${newMarks.length} marks for CIE1.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

fixData();
