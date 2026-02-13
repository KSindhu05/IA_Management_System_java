require('dotenv').config();
const { User } = require('./src/models');
const { Op } = require('sequelize');

async function checkUsers() {
    try {
        console.log('--- START DEBUG ---');

        // Check what departments exist for students
        const students = await User.findAll({
            where: { role: 'STUDENT' },
            attributes: ['id', 'username', 'department']
        });

        console.log(`Total Students Found: ${students.length}`);

        // Group by department
        const deptCounts = {};
        students.forEach(s => {
            const d = s.department || 'NULL';
            deptCounts[d] = (deptCounts[d] || 0) + 1;
        });

        console.log('Student Department Distribution:', deptCounts);

        // Check specifically for 'CS'
        const csStudents = students.filter(s => s.department === 'CS');
        console.log(`Students with department='CS': ${csStudents.length}`);

        // Check for 'Computer Science' or 'CSE'
        const cseStudents = students.filter(s => ['CSE', 'Computer Science', 'CS&E'].includes(s.department));
        console.log(`Students with department='CSE'/'Computer Science': ${cseStudents.length}`);

        console.log('--- END DEBUG ---');
        process.exit(0);
    } catch (error) {
        console.error('Error during check:', error);
        process.exit(1);
    }
}

checkUsers();
