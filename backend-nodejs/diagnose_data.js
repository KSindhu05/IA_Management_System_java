const sequelize = require('./src/config/database');
const { Student, Subject, CIEMark } = require('./src/models');

async function diagnose() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Check Students
        const students = await Student.findAll({
            where: { department: 'Computer Science & Engineering' },
            attributes: ['id', 'regNo', 'name', 'semester', 'section']
        });
        console.log(`Found ${students.length} CS Students.`);

        const nullSem = students.filter(s => !s.semester);
        console.log(`Students with null/empty semester: ${nullSem.length}`);
        if (nullSem.length > 0) console.log('first null sem student:', nullSem[0].dataValues);

        // 2. Check Subject
        const subject = await Subject.findOne({ where: { name: 'Engineering Maths-II' } });
        if (!subject) {
            console.log('Subject "Engineering Maths-II" NOT FOUND.');
        } else {
            console.log(`Subject Found: ${subject.name} (ID: ${subject.id})`);

            // 3. Check Marks
            const marks = await CIEMark.findAll({
                where: { subjectId: subject.id }
            });
            console.log(`Found ${marks.length} marks for this subject.`);

            if (marks.length > 0) {
                console.log('Sample Mark:', JSON.stringify(marks[0], null, 2));
                const studentIds = students.map(s => s.id);
                const matching = marks.filter(m => studentIds.includes(m.studentId));
                console.log(`Marks belonging to fetched CS students: ${matching.length}`);

                if (matching.length === 0) {
                    console.log('CRITICAL: Marks exist but DO NOT match these Students IDs.');
                    console.log('Sample Student ID:', students[0].id);
                    console.log('Sample Mark StudentID:', marks[0].studentId);
                }
            } else {
                console.log('No marks found for strict subjectId match.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        // process.exit(0); // Don't exit to allow pool to close gracefully if needed, but script needs to end
        setTimeout(() => process.exit(0), 1000);
    }
}

diagnose();
