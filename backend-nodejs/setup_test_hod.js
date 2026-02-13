const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function createTestHod() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const hashedPassword = await bcrypt.hash('password123', 10);

        const [user, created] = await User.findOrCreate({
            where: { username: 'hod_cs' },
            defaults: {
                fullName: 'Test HOD CS',
                email: 'hod_cs@college.edu',
                password: hashedPassword,
                role: 'HOD',
                department: 'CS',
                associatedId: 'HOD001'
            }
        });

        if (created) {
            console.log('Created test HOD user: hod_cs / password123');
        } else {
            console.log('Test HOD user already exists. Updating password...');
            user.password = hashedPassword;
            await user.save();
            console.log('Password updated to password123');
        }

    } catch (error) {
        console.error('Error creating HOD:', error);
    } finally {
        await sequelize.close();
    }
}

createTestHod();
