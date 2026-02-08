const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const CIEMark = require('./src/models/CIEMark');

async function seedSubmittedMarks() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Update marks for Subject ID 1 (Data Structures) to SUBMITTED
        const [updatedRows] = await CIEMark.update(
            { status: 'SUBMITTED' },
            { where: { subjectId: 1 } }
        );

        console.log(`Updated ${updatedRows} marks to 'SUBMITTED' status for Subject ID 1.`);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

seedSubmittedMarks();
