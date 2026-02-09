const { Sequelize } = require('sequelize');
const config = require('./src/config/database');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

const sequelize = require('./src/config/database');

async function fix() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Find the user
        const user = await User.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('full_name')),
                { [Sequelize.Op.like]: '%manju%' }
            )
        });

        if (!user) {
            console.log('User Ramesh not found! Trying generic query...');
            const allUsers = await User.findAll();
            console.log('Available Users:', allUsers.map(u => `${u.id}: ${u.fullName} (${u.username})`));
            return;
        }

        console.log(`Found User: ${user.fullName} (ID: ${user.id})`);

        // 2. Update Subjects for CS to this user
        // We will update: CAEG, Python, Indian Constitution, IC, Engineering Maths-II, English Communication
        // Or just update ALL 'CS' department subjects?
        // Let's update typical CS subjects.

        const targetSubjects = ['CAEG', 'Python', 'Indian Constitution', 'IC', 'Engineering Maths-II', 'English Communication', 'Communication Skills'];

        const [updatedRows] = await Subject.update(
            { instructorId: String(user.id) },
            {
                where: {
                    name: targetSubjects,
                    department: 'CS'
                }
            }
        );

        console.log(`Updated ${updatedRows} subjects to belong to User ID ${user.id}.`);

        // Verify
        const subjects = await Subject.findAll({ where: { instructorId: String(user.id) } });
        console.log('Verified Subjects linked to user:', subjects.map(s => `${s.name} (${s.department}, ${s.semester})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fix();
