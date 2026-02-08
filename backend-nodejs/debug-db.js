const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const CIEMark = require('./src/models/CIEMark');
const Student = require('./src/models/Student');
const Subject = require('./src/models/Subject');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const marks = await CIEMark.findAll();
        console.log(`Total marks records: ${marks.length}`);

        const submittedMarks = await CIEMark.findAll({ where: { status: 'SUBMITTED' } });
        console.log(`Marks with status 'SUBMITTED': ${submittedMarks.length}`);

        const pendingMarks = await CIEMark.findAll({ where: { status: 'PENDING' } });
        console.log(`Marks with status 'PENDING': ${pendingMarks.length}`);

        const approvedMarks = await CIEMark.findAll({ where: { status: 'APPROVED' } });
        console.log(`Marks with status 'APPROVED': ${approvedMarks.length}`);

        if (submittedMarks.length > 0) {
            console.log('Sample submitted mark:', JSON.stringify(submittedMarks[0], null, 2));
        }

        // Check Subjects
        const subjects = await Subject.findAll();
        console.log(`Total subjects: ${subjects.length}`);
        console.log('Subjects:', subjects.map(s => `${s.id}: ${s.name} (${s.department})`).join(', '));


    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
