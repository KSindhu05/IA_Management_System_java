const { User, Subject, Student } = require('./src/models');
const sequelize = require('./src/config/database');

async function fixFaculty() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Target faculty
        const targets = ['fac003', 'fac004'];

        for (const username of targets) {
            console.log(`Checking ${username}...`);
            const user = await User.findOne({ where: { username } });

            if (!user) {
                console.log(`User ${username} not found!`);
                continue;
            }

            console.log(`Setting Department to CSE for ${username}`);
            user.department = 'CSE';
            if (username === 'fac003') {
                user.fullName = 'Ramesh Gouda';
                user.role = 'FACULTY';
                user.semester = '4'; // Set semester
                user.section = 'A'; // Set section
            } else if (username === 'fac004') {
                user.fullName = 'Wahida Banu';
                user.role = 'FACULTY';
                user.semester = '6'; // Set semester
                user.section = 'B'; // Set section
            }
            await user.save();

            // Find Subjects not assigned? Or just assign specific ones.
            // Let's create dummy subjects if needed, or update existing ones.
            // For simplicity, let's update specific subjects to be taught by them

            // For fac003 (S4, CSE)
            if (username === 'fac003') {
                const sub1 = await Subject.count({ where: { code: 'CS401' } });
                if (sub1 === 0) {
                    await Subject.create({
                        name: 'Analysis of Algorithms',
                        code: 'CS401',
                        department: 'CSE',
                        semester: '4',
                        instructorId: user.id.toString(),
                        instructorName: user.fullName,
                        credits: 4
                    });
                    console.log('Created CS401 for fac003');
                } else {
                    await Subject.update({ instructorId: user.id.toString(), instructorName: user.fullName }, { where: { code: 'CS401' } });
                    console.log('Updated CS401 for fac003');
                }
            }

            // For fac004 (S6, CSE)
            if (username === 'fac004') {
                const sub2 = await Subject.count({ where: { code: 'CS601' } });
                if (sub2 === 0) {
                    await Subject.create({
                        name: 'Machine Learning',
                        code: 'CS601',
                        department: 'CSE',
                        semester: '6',
                        instructorId: user.id.toString(),
                        instructorName: user.fullName,
                        credits: 4
                    });
                    console.log('Created CS601 for fac004');
                } else {
                    await Subject.update({ instructorId: user.id.toString(), instructorName: user.fullName }, { where: { code: 'CS601' } });
                    console.log('Updated CS601 for fac004');
                }
            }
            // Ensure students exist for these semesters?
            const studentCount = await Student.count({ where: { department: 'CSE', semester: user.semester } });
            if (studentCount === 0) {
                console.log(`Creating dummy students for ${user.semester}th Sem CSE...`);
                for (let i = 1; i <= 5; i++) {
                    await Student.create({
                        regNo: `CS${user.semester}0${i}`,
                        name: `Student ${i}`,
                        department: 'CSE',
                        semester: user.semester,
                        section: user.section || 'A',
                        email: `student${user.semester}${i}@example.com`,
                        phone: '1234567890',
                        userId: `CS${user.semester}0${i}`
                    });
                }
                console.log('Created 5 dummy students.');
            } else {
                console.log(`Found ${studentCount} students for ${user.semester}th Sem.`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixFaculty();
