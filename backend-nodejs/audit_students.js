const sequelize = require('./src/config/database');
const { Student } = require('./src/models');

async function audit() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const students = await Student.findAll();
        console.log(`Total Students: ${students.length}`);

        const depts = {};
        students.forEach(s => {
            depts[s.department] = (depts[s.department] || 0) + 1;
        });

        console.log('Departments found:', depts);

        if (students.length > 0) {
            console.log('Sample Student:', students[0].toJSON());
        }

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

audit();
