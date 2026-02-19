const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const CIEMark = require('./src/models/CIEMark');

async function debugState() {
    try {
        await sequelize.authenticate();
        console.log('--- USERS ---');
        const users = await User.findAll({ attributes: ['id', 'username', 'role'] });
        users.forEach(u => console.log(`${u.id}: ${u.username} (${u.role})`));

        console.log('\n--- SUBJECTS ---');
        const subjects = await Subject.findAll({ attributes: ['id', 'name', 'code', 'instructorId'] });
        subjects.forEach(s => console.log(`Subject ${s.id}: ${s.name} (Instructor: ${s.instructorId})`));

        console.log('\n--- CIE MARKS (< 20) ---');
        const marks = await CIEMark.findAll({
            where: { marks: 20 }, // Wait, checking for low ones specifically or just sample? Let's check all low ones.
            // Actually let's just dump the ones < 20
        });
        // Filtering in JS to avoid operator import just for this script if not needed, but better to use SQL
        // Re-requesting with Op
        const { Op } = require('sequelize');
        const lowMarks = await CIEMark.findAll({
            where: { marks: { [Op.lt]: 20 } },
            limit: 20
        });
        lowMarks.forEach(m => console.log(`Mark ${m.id}: Student ${m.studentId}, Subject ${m.subjectId}, Score ${m.marks}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugState();
