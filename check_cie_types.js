const { CIEMark } = require('./backend-nodejs/src/models');

async function checkCieTypes() {
    try {
        const marks = await CIEMark.findAll({
            attributes: ['cieType'],
            group: ['cieType']
        });
        console.log("Unique CIE Types in DB:", marks.map(m => m.cieType));
    } catch (error) {
        console.error("Error:", error);
    }
}

checkCieTypes();
