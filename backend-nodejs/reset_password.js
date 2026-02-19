const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function resetPassword() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const username = 'FAC001';
        const newPassword = 'password';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updatedRows] = await User.update(
            { password: hashedPassword },
            { where: { username: username } }
        );

        if (updatedRows > 0) {
            console.log(`Password for ${username} reset successfully to '${newPassword}'`);
        } else {
            console.log(`User ${username} not found.`);
        }

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await sequelize.close();
    }
}

resetPassword();
