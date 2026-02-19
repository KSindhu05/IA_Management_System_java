const { Sequelize, Op } = require('sequelize');
const sequelize = require('./src/config/database');
const Subject = require('./src/models/Subject');
const CIEMark = require('./src/models/CIEMark');
const Student = require('./src/models/Student');

async function simulate(userId) {
    try {
        console.log(`\n\n--- Simulating for User ID: ${userId} ---`);

        // 1. Get Faculty's Subjects
        const subjects = await Subject.findAll({ where: { instructorId: userId } });
        const subjectIds = subjects.map(s => s.id);

        console.log(`Found ${subjects.length} subjects: ${subjects.map(s => `${s.id}:${s.name}`).join(', ')}`);

        if (subjectIds.length === 0) {
            console.log("No subjects found.");
            return;
        }

        // 6. Get List of Low Performers (Marks < 20)
        const lowPerformerMarks = await CIEMark.findAll({
            where: {
                subjectId: { [Op.in]: subjectIds },
                marks: { [Op.lt]: 20 }
            },
            include: [
                { model: Student, as: 'student', attributes: ['name', 'regNo'] },
                { model: Subject, as: 'subject', attributes: ['name', 'code'] }
            ],
            limit: 10,
            order: [['marks', 'ASC']]
        });

        console.log(`Found ${lowPerformerMarks.length} low performers:`);
        lowPerformerMarks.forEach(m => {
            console.log(`- Student: ${m.student?.name} (${m.student?.regNo})`);
            console.log(`  Subject: ${m.subject?.name} (${m.subject?.code})`);
            console.log(`  Mark: ${m.marks} (${m.cieType})`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

async function run() {
    await sequelize.authenticate();
    await simulate(1);
    await simulate(2);
    await simulate(3); // The one from my seed check
    await sequelize.close();
}

run();
