const fs = require('fs');
const path = require('path');
const sequelize = require('./src/config/database');
const { Student } = require('./src/models');

async function importPhones() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Sync to ensure column exists (though server should do it)
        await sequelize.sync({ alter: true });

        const csvPath = path.join(__dirname, 'student_data.csv');
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const dataLines = lines.slice(1);

        let count = 0;
        for (const line of dataLines) {
            const cols = line.split(',').map(c => c.trim());
            if (cols.length < 6) continue;

            const regNo = cols[0];
            const parentPhone = cols[5];

            if (parentPhone) {
                const [updateCount] = await Student.update(
                    { parentPhone: parentPhone },
                    { where: { regNo: regNo } }
                );
                if (updateCount > 0) count++;
            }
        }
        console.log(`Updated Parent Phones for ${count} students.`);

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

importPhones();
