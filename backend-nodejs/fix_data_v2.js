const sequelize = require('./src/config/database');
const { Student, Subject, CIEMark } = require('./src/models');
const { Op } = require('sequelize');

async function fixData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Fix Student Semesters (Update ALL to be safe)
        const [updatedRows] = await Student.update(
            { semester: '2' },
            { where: {} }
        );
        console.log(`Updated semester to '2' for ${updatedRows} students.`);

        // 2. Fetch CS Students for Marks Seeding
        // Handle variations: 'CS', 'CSE', 'Computer Science...'
        const students = await Student.findAll({
            where: {
                [Op.or]: [
                    { department: 'CS' },
                    { department: { [Op.like]: 'Computer Science%' } },
                    { department: { [Op.like]: 'CSE%' } }
                ]
            }
        });
        console.log(`Found ${students.length} CS/CSE Students for marks verification.`);

        if (students.length === 0) {
            console.log("CRITICAL: No CS students found even with broad search!");
            const all = await Student.findAll({ limit: 5 });
            console.log("Sample existing depts:", all.map(s => s.department));
            return;
        }

        // 3. Re-seed Marks
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

            // Delete existing marks for this subject
            await CIEMark.destroy({ where: { subjectId: subject.id } });
            console.log(`  Cleared old marks.`);

            // Create new marks
            const newMarks = students.map(student => ({
                studentId: student.id,
                subjectId: subject.id,
                cieType: 'CIE1',
                marks: Math.floor(Math.random() * (48 - 30 + 1)) + 30, // Random 30-48
                maxMarks: 50,
                attendance: Math.floor(Math.random() * (100 - 75 + 1)) + 75,
                status: 'PENDING' // Set to PENDING so they are editable
            }));

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
