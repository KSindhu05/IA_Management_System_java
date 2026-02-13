require('dotenv').config();
const { User } = require('./src/models');

async function fixStudentDept() {
    try {
        console.log('Updating student departments to "CS"...');

        const [updatedCount] = await User.update(
            { department: 'CS' },
            {
                where: {
                    role: 'STUDENT',
                    department: null
                }
            }
        );

        console.log(`Updated ${updatedCount} students.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixStudentDept();
