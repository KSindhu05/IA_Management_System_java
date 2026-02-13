const { User, Student } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkSectionC() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Checking for Faculty in Section C...');
        const facultyC = await User.findAll({ where: { section: 'C', role: 'FACULTY' } });
        if (facultyC.length > 0) {
            facultyC.forEach(f => console.log(`[FACULTY] ${f.username} - Dept: ${f.department} - Sec: ${f.section}`));
        } else {
            console.log('No Faculty in Section C.');
        }

        console.log('Checking for Students in Section C...');
        const studentC = await Student.findAll({ where: { section: 'C' } });
        if (studentC.length > 0) {
            studentC.forEach(s => console.log(`[STUDENT] ${s.regNo} (${s.name}) - Dept: ${s.department} - Sec: ${s.section}`));
        } else {
            console.log('No Students in Section C.');
        }

        // Also check Section B just to be sure about user's claim
        console.log('Checking for Students in Section B...');
        const studentB = await Student.findAll({ where: { section: 'B' } });
        console.log(`Found ${studentB.length} students in Section B.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSectionC();
