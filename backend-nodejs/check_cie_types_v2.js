require('dotenv').config();
const { CIEMark } = require('./src/models');

async function checkCieTypes() {
    try {
        const marks = await CIEMark.findAll({
            attributes: ['cieType'],
            group: ['cieType']
        });
        console.log("Unique CIE Types in DB:", marks.map(m => m.cieType));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkCieTypes();
