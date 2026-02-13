const { User, Subject, Student } = require('./src/models');
const sequelize = require('./src/config/database');

async function fixFaculty() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Target faculty
        const username = 'fac004';
        console.log(`Checking ${username}...`);

        const user = await User.findOne({ where: { username } });

        if (!user) {
            console.log(`User ${username} not found!`);
            return;
        }

        console.log(`Current State: Dept=${user.department}, Name=${user.fullName}`);

        // Update User
        user.department = 'CSE';
        user.fullName = 'Wahida Banu';
        user.role = 'FACULTY';
        user.semester = '6';
        user.section = 'B';

        try {
            await user.save();
            console.log(`Updated User: Dept=${user.department}, Name=${user.fullName}`);
        } catch (e) {
            console.error('Failed to save user:', e);
        }

        // Assign Subject CS601
        const subCode = 'CS601';
        let subject = await Subject.findOne({ where: { code: subCode } });

        if (!subject) {
            console.log(`Creating ${subCode}...`);
            subject = await Subject.create({
                name: 'Machine Learning',
                code: subCode,
                department: 'CSE',
                semester: '6',
                instructorId: user.id.toString(),
                instructorName: user.fullName,
                credits: 4
            });
            console.log('Subject Created.');
        } else {
            console.log(`Updating ${subCode}...`);
            subject.instructorId = user.id.toString();
            subject.instructorName = user.fullName;
            subject.department = 'CSE'; // Ensure dept matches
            await subject.save();
            console.log('Subject Updated.');
        }

        // Check Students
        const studentCount = await Student.count({ where: { department: 'CSE', semester: '6' } });
        if (studentCount === 0) {
            console.log(`Creating dummy students for 6th Sem CSE...`);
            for (let i = 1; i <= 5; i++) {
                await Student.create({
                    regNo: `CS60${i}`,
                    name: `Student 60${i}`,
                    department: 'CSE',
                    semester: '6',
                    section: 'B',
                    email: `student60${i}@example.com`,
                    phone: '1234567890',
                    userId: `CS60${i}`
                });
            }
            console.log('Created 5 dummy students.');
        } else {
            console.log(`Found ${studentCount} students for 6th Sem.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixFaculty();
