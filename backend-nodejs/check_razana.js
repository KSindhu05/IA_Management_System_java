const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

async function checkRazana() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const razana = await User.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { username: 'Razana' },
                    { fullName: 'Razana' }
                ]
            }
        });

        if (!razana) {
            console.log('User "Razana" NOT FOUND.');
            return;
        }

        console.log(`Found User: ID=${razana.id}, Username=${razana.username}, Name=${razana.fullName}`);

        const subjects = await Subject.findAll({ where: { instructorId: razana.id.toString() } });
        console.log(`Subjects assigned to ID ${razana.id}:`, subjects.map(s => s.name));

        // Also check by name just in case
        const subjectsByName = await Subject.findAll({ where: { instructorName: razana.fullName || razana.username } });
        console.log(`Subjects assigned by Name "${razana.fullName || razana.username}":`, subjectsByName.map(s => s.name));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkRazana();
