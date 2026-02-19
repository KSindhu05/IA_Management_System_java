const { CIEMark, Subject } = require('./src/models');
const sequelize = require('./src/config/database');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const count = await CIEMark.count();
        console.log('Total CIEMark count:', count);

        const subjects = await Subject.findAll({ where: { department: 'CS' } });
        console.log('CS Subjects found:', subjects.map(s => s.name).join(', '));

        const csSubjectIds = subjects.map(s => s.id);
        const marksCount = await CIEMark.count({
            where: { subjectId: csSubjectIds }
        });
        console.log('Marks found for CS subjects:', marksCount);

        if (marksCount > 0) {
            const samples = await CIEMark.findAll({
                where: { subjectId: csSubjectIds },
                limit: 5
            });
            console.log('Sample marks:', JSON.stringify(samples, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkData();
