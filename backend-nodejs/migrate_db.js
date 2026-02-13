const sequelize = require('./src/config/database');
const { User, Subject, Student } = require('./src/models');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // precise sync
        await User.sync({ alter: true });
        console.log('User table synced.');

        await sequelize.close();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
