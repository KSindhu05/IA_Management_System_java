require('dotenv').config();
const { User } = require('./src/models');

async function dumpStudents() {
    try {
        const students = await User.findAll({
            where: { role: 'STUDENT' },
            limit: 5
        });

        console.log('--- START DUMP ---');
        console.log(JSON.stringify(students.map(s => s.toJSON()), null, 2));
        console.log('--- END DUMP ---');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

dumpStudents();
