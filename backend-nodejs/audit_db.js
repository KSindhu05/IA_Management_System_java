const { Sequelize } = require('sequelize');
const config = require('./src/config/database');
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

const sequelize = require('./src/config/database');

const fs = require('fs');

async function audit() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        await sequelize.authenticate();
        log('Connected.');

        log('\n--- USERS ---');
        const users = await User.findAll();
        users.forEach(u => {
            log(`ID: ${u.id}, Name: ${u.fullName} (${u.username}), Role: ${u.role}`);
        });

        log('\n--- SUBJECTS ---');
        const subjects = await Subject.findAll();
        subjects.forEach(s => {
            log(`ID: ${s.id}, Name: '${s.name}', Dept: '${s.department}', Sem: '${s.semester}', InstructorId: '${s.instructorId}'`);
        });

        fs.writeFileSync('audit_output.txt', output);

    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        await sequelize.close();
    }
}

audit();
