const { Sequelize } = require('sequelize');
const config = require('./src/config/database');
const Subject = require('./src/models/Subject');

const sequelize = require('./src/config/database');

async function distribute() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Assignments based on audit:
        // Manju (ID 3): Maths (5), Indian Constitution (9)
        // Ramesh (ID 4): CAEG (7), Python (8)
        // Nasrin (ID 6): English Communication (6)

        // Reset assignments first? No, just overwrite.

        // Manju
        await Subject.update({ instructorId: '3' }, { where: { id: [5, 9] } });
        console.log('Assigned Maths & Constitution to Manju (ID 3)');

        // Ramesh
        await Subject.update({ instructorId: '4' }, { where: { id: [7] } });
        console.log('Assigned CAEG to Ramesh (ID 4)');

        // Wahida (Python & Indian Constitution)
        await Subject.update({ instructorId: '5' }, { where: { id: [8, 9] } });
        console.log('Assigned Python & Indian Constitution to Wahida (ID 5)');

        // Manju (Maths only now, since Constitution moved to Wahida)
        // Ensure Manju still has Maths (ID 5)
        await Subject.update({ instructorId: '3' }, { where: { id: [5] } });
        console.log('Verified Maths for Manju (ID 3)');

        // Nasrin
        await Subject.update({ instructorId: '6' }, { where: { id: 6 } });
        console.log('Assigned English Communication to Nasrin (ID 6)');

        // Verify
        const subjects = await Subject.findAll();
        subjects.forEach(s => {
            console.log(`Subject ${s.name} -> Instructor ${s.instructorId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

distribute();
