const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const Subject = require('./src/models/Subject');

async function checkSubjects() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const subjects = await Subject.findAll();
        console.log('Total Subjects:', subjects.length);

        const departments = new Set();
        console.log('--- SUBJECT LIST START ---');
        subjects.forEach(s => {
            departments.add(s.department);
            console.log(`[SUBJECT] ID: ${s.id} | Name: "${s.name}" | Dept: "${s.department}" | Instructor: "${s.instructorName}"`);
        });
        console.log('--- SUBJECT LIST END ---');
        console.log('Unique Departments:', Array.from(departments));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkSubjects();
