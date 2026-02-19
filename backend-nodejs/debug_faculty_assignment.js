const { User, Subject, Student } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkFacultyData() {
    try {
        // Disable logging for this session if possible, or just ignore the noise
        sequelize.options.logging = false;

        await sequelize.authenticate();
        console.log('Database connected.');

        const targetUsernames = ['fac003', 'fac004'];

        for (const username of targetUsernames) {
            console.log(`\n--------------------------------------------------`);
            console.log(`Checking ${username}...`);
            const user = await User.findOne({ where: { username }, logging: false });

            if (!user) {
                console.log(`User ${username} NOT FOUND in database!`);
                continue;
            }

            console.log(`User Found:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Name: ${user.fullName}`);
            console.log(`  Department: ${user.department}`);
            console.log(`  Role: ${user.role}`);

            const subjects = await Subject.findAll({ where: { instructorId: user.id }, logging: false });

            if (subjects.length === 0) {
                console.log(`  WARNING: No subjects assigned to this faculty!`);
            } else {
                console.log(`  Assigned Subjects (${subjects.length}):`);
                subjects.forEach(s => console.log(`    - [${s.code}] ${s.name} (Sem: ${s.semester})`));
            }

            if (user.department) {
                const studentCount = await Student.count({ where: { department: user.department }, logging: false });
                console.log(`  Department Stats: ${studentCount} students in ${user.department}`);
            }
        }
        console.log(`\n--------------------------------------------------`);

    } catch (error) {
        console.error('Error during check:', error);
    } finally {
        await sequelize.close();
    }
}

checkFacultyData();
