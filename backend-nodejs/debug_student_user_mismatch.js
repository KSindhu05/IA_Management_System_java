require('dotenv').config();
const { User, Student } = require('./src/models');

async function checkIds() {
    try {
        console.log('--- Checking for ID Mismatch ---');

        // Get a student user
        const user = await User.findOne({
            where: { role: 'STUDENT' },
            attributes: ['id', 'username']
        });

        if (!user) {
            console.log('No student user found.');
            process.exit(0);
        }

        console.log(`User found: ID=${user.id}, Username=${user.username}`);

        // Get corresponding student record
        const student = await Student.findOne({
            where: { regNo: user.username },
            attributes: ['id', 'regNo']
        });

        if (!student) {
            console.log('No corresponding Student record found.');
        } else {
            console.log(`Student found: ID=${student.id}, RegNo=${student.regNo}`);

            if (user.id !== student.id) {
                console.log('⚠️ MISMATCH DETECTED: User.id does not match Student.id');
                console.log('Notifications are stored with User.id, but fetched with Student.id');
            } else {
                console.log('✅ IDs match. No mismatch.');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkIds();
