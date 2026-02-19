const { User } = require('./src/models');
const sequelize = require('./src/config/database');
const fs = require('fs');

async function checkDepartments() {
    try {
        await sequelize.authenticate();
        let output = 'Database connected.\n';

        const faculty = await User.findAll({
            where: { role: 'FACULTY' },
            attributes: ['id', 'username', 'fullName', 'department']
        });

        output += '\n--- ALL FACULTY ---\n';
        faculty.forEach(f => {
            output += `[${f.id}] ${f.username} (${f.fullName}) - Dept: '${f.department}'\n`;
        });

        const hods = await User.findAll({
            where: { role: 'HOD' },
            attributes: ['id', 'username', 'department']
        });

        output += '\n--- ALL HODs ---\n';
        hods.forEach(h => {
            output += `[${h.id}] ${h.username} - Dept: '${h.department}'\n`;
        });

        fs.writeFileSync('dept_check_output.txt', output);
        console.log('Output written to dept_check_output.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDepartments();
