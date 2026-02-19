const { Sequelize, Op } = require('sequelize');
const sequelize = require('./src/config/database');
const CIEMark = require('./src/models/CIEMark');

async function checkStatus() {
    try {
        await sequelize.authenticate();
        console.log('Checking status of marks < 20...');
        const marks = await CIEMark.findAll({
            where: { marks: { [Op.lt]: 20 } },
            attributes: ['id', 'marks', 'cieType', 'status', 'subjectId'],
            limit: 20
        });

        marks.forEach(m => {
            console.log(`ID: ${m.id}, Mark: ${m.marks}, CIE: ${m.cieType}, Status: ${m.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkStatus();
