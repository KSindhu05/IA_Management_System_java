const { User, Student } = require('./src/models');
const sequelize = require('./src/config/database');
const fs = require('fs');

async function checkSectionC() {
    try {
        await sequelize.authenticate();
        let log = 'Database connected.\n';

        log += '\nChecking for Faculty in Section C...\n';
        const facultyC = await User.findAll({ where: { section: 'C', role: 'FACULTY' } });
        if (facultyC.length > 0) {
            facultyC.forEach(f => log += `[FACULTY] ${f.username} - Dept: ${f.department} - Sec: ${f.section}\n`);
        } else {
            log += 'No Faculty in Section C.\n';
        }

        log += '\nChecking for Students in Section C...\n';
        const studentC = await Student.findAll({ where: { section: 'C' } });
        if (studentC.length > 0) {
            studentC.forEach(s => log += `[STUDENT] ${s.regNo} (${s.name}) - Dept: ${s.department} - Sec: ${s.section}\n`);
        } else {
            log += 'No Students in Section C.\n';
        }

        log += '\nChecking for Students in Section B...\n';
        const studentB = await Student.findAll({ where: { section: 'B' } });
        log += `Found ${studentB.length} students in Section B.\n`;

        fs.writeFileSync('debug_section_output.txt', log);
        console.log('Output written to debug_section_output.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkSectionC();
