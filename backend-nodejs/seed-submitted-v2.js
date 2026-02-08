const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = require('./src/config/database');
const CIEMark = require('./src/models/CIEMark');

async function seedSubmittedMarks() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Update marks for a range of IDs to SUBMITTED
        const [updatedRows] = await CIEMark.update(
            { status: 'SUBMITTED' },
            { where: { id: { [Op.between]: [1, 10] } } } // Update first 10 marks
        );

        console.log(`Updated ${updatedRows} marks to 'SUBMITTED' status.`);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

seedSubmittedMarks();
