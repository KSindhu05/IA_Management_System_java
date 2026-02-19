const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = require('./src/config/database');
const Subject = require('./src/models/Subject');
const User = require('./src/models/User');

async function testFacultyLogic() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // 1. Define inputs (Mocking what comes from frontend)
        const instructorId = 999; // Dummy ID
        const instructorName = "Test Faculty";
        const department = "CS";
        const subjectsToAssign = ["Engineering Maths-II", "Python"]; // Use real subject names from previous check

        console.log('Testing assignment for:', subjectsToAssign);

        for (const subName of subjectsToAssign) {
            // The exact logic from hod.js
            const [affectedRows] = await Subject.update(
                { instructorId: instructorId.toString(), instructorName: instructorName },
                {
                    where: {
                        [Op.and]: [
                            sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), sequelize.fn('LOWER', subName)),
                            { department: department }
                        ]
                    }
                }
            );
            console.log(`[TEST] Assigned '${subName}': ${affectedRows} rows updated.`);

            // Verify
            const updatedSubject = await Subject.findOne({
                where: {
                    [Op.and]: [
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), sequelize.fn('LOWER', subName)),
                        { department: department }
                    ]
                }
            });
            console.log(`[VERIFY] Subject '${subName}' instructorId is now:`, updatedSubject ? updatedSubject.instructorId : 'Not Found');
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await sequelize.close();
    }
}

testFacultyLogic();
