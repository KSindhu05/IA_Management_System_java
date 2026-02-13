const { User, Subject, Student } = require('./src/models');
const sequelize = require('./src/config/database');

async function fixDept() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Update FAC003 and FAC004 to 'CS'
        const targets = ['fac003', 'fac004'];

        for (const username of targets) {
            console.log(`Updating ${username} to CS...`);
            const user = await User.findOne({ where: { username } });
            if (user) {
                user.department = 'CS';
                await user.save();
                console.log(`Updated ${username} department to CS.`);

                // Update their subjects too? 
                await Subject.update({ department: 'CS' }, { where: { instructorId: user.id.toString() } });
                console.log(`Updated subjects for ${username} to CS.`);

                // Update their dummy students?
                await Student.update({ department: 'CS' }, { where: { department: 'CSE', semester: user.semester } });
                console.log(`Updated students for ${username} to CS.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixDept();
