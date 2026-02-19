const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const CIEMark = require('./src/models/CIEMark');

async function seedLowMark() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Find a valid student and subject/faculty
        // For simplicity, we'll insert a dummy low mark for student ID 1, Subject ID 1 (Assuming they exist)
        // Adjust IDs if necessary based on your database

        const lowMark = await CIEMark.create({
            studentId: 1,
            subjectId: 5,
            marks: 12, // Low mark
            cieType: 'CIE1',
            maxMarks: 50,
            attendance: 85,
            status: 'SUBMITTED'
        });

        console.log('Seeded Low Mark:', lowMark.toJSON());

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

seedLowMark();
