const { User } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkDepartments() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const faculty = await User.findAll({
            where: { role: 'FACULTY' },
            attributes: ['id', 'username', 'fullName', 'department', 'semester', 'section']
        });

        console.log('\n--- ALL FACULTY ---');
        faculty.forEach(f => {
            console.log(`[${f.id}] ${f.username} (${f.fullName}) - Dept: '${f.department}'`);
        });

        const hods = await User.findAll({
            where: { role: 'HOD' },
            attributes: ['id', 'username', 'department']
        });

        console.log('\n--- ALL HODs ---');
        hods.forEach(h => {
            console.log(`[${h.id}] ${h.username} - Dept: '${h.department}'`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDepartments();
