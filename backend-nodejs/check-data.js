const { Student, CIEMark, Subject, User } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkStudentData() {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connected\n');

        // Check student 459CS25001
        const student = await Student.findOne({
            where: { regNo: '459CS25001' },
            include: [
                {
                    model: User,
                    as: 'user'
                },
                {
                    model: CIEMark,
                    as: 'marks',
                    include: [{ model: Subject, as: 'subject' }]
                }
            ]
        });

        if (student) {
            console.log('Student Found:', student.name);
            console.log('User Account:', student.user ? 'YES' : 'NO');
            console.log('Marks Records:', student.marks.length);
            console.log('\nMarks Details:');
            student.marks.forEach(mark => {
                console.log(`  - ${mark.subject.name}: ${mark.marks}/50, Attendance: ${mark.attendance}%`);
            });
        } else {
            console.log('Student not found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStudentData();
