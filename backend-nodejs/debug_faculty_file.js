const { User, Subject } = require('./src/models');
const sequelize = require('./src/config/database');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'debug_output.txt');

function log(msg) {
    fs.appendFileSync(OUTPUT_FILE, msg + '\n');
}

async function checkFacultyData() {
    try {
        fs.writeFileSync(OUTPUT_FILE, 'Starting Debug...\n');
        await sequelize.authenticate();
        log('Database connected.');

        const targetUsernames = ['fac003', 'fac004'];

        for (const username of targetUsernames) {
            log(`\nChecking ${username}...`);
            const user = await User.findOne({ where: { username } });

            if (!user) {
                log(`User ${username} NOT FOUND in database!`);
                continue;
            }

            log(`User Found: ID=${user.id}, Name=${user.fullName}, Dept=${user.department}, Role=${user.role}`);

            const subjects = await Subject.findAll({ where: { instructorId: user.id } });

            if (subjects.length === 0) {
                log(`WARNING: No subjects assigned to this faculty!`);
            } else {
                log(`Assigned Subjects (${subjects.length}):`);
                subjects.forEach(s => log(` - [${s.code}] ${s.name} (Sem: ${s.semester})`));
            }
        }

    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkFacultyData();
