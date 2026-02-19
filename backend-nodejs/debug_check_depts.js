require('dotenv').config();
const { User } = require('./src/models');

async function checkDepts() {
    try {
        const students = await User.findAll({
            where: { role: 'STUDENT' },
            attributes: ['department']
        });

        const depts = new Set(students.map(s => s.department));
        console.log('Distinct Departments for Students:', Array.from(depts));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDepts();
