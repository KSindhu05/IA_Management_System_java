const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/database');
const Student = require('./src/models/Student');
const Subject = require('./src/models/Subject');

async function findIds() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const student = await Student.findOne();
        const subject = await Subject.findOne();

        if (student && subject) {
            console.log(`Valid Student ID: ${student.id}`);
            console.log(`Valid Subject ID: ${subject.id}`);
            console.log(`Valid Instructor ID: ${subject.instructorId}`);

            // Check if they are linked? Not strictly necessary for CIEMark fk, but good to know
        } else {
            console.log('Could not find student or subject.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

findIds();
