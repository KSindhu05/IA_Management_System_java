const bcrypt = require('bcryptjs');
const { User, Student, Subject } = require('../models');
const sequelize = require('../config/database');

async function seedDatabase() {
    try {
        console.log('\n🌱 Starting database seeding...\n');

        // Create Principal
        console.log('Creating Principal...');
        const principalPassword = await bcrypt.hash('password', 10);
        const principal = await User.create({
            username: 'PRINCIPAL',
            password: principalPassword,
            role: 'PRINCIPAL',
            fullName: 'Dr. Gowri Shankar',
            associatedId: 'PRINCIPAL'
        });
        console.log('✓ Principal created');

        // Create HOD
        console.log('Creating HOD...');
        const hodPassword = await bcrypt.hash('password', 10);
        const hod = await User.create({
            username: 'HOD001',
            password: hodPassword,
            role: 'HOD',
            department: 'CS',
            fullName: 'MD Jaffar',
            associatedId: 'HOD001'
        });
        console.log('✓ HOD created');

        // Create Faculty
        console.log('Creating Faculty members...');
        const facultyData = [
            { username: 'FAC001', fullName: 'Miss Manju Sree', department: 'CS' },
            { username: 'FAC002', fullName: 'Ramesh Gouda', department: 'CS' },
            { username: 'FAC003', fullName: 'Wahida Banu', department: 'CS' },
            { username: 'FAC004', fullName: 'Nasrin Banu', department: 'CS' },
            { username: 'FAC005', fullName: 'Sunil Babu H', department: 'CS' }
        ];

        const facultyPassword = await bcrypt.hash('password', 10);
        for (const fac of facultyData) {
            await User.create({
                username: fac.username,
                password: facultyPassword,
                role: 'FACULTY',
                department: fac.department,
                fullName: fac.fullName,
                associatedId: fac.username
            });
        }
        console.log(`✓ Created ${facultyData.length} faculty members`);

        // Create Subjects
        console.log('\nCreating Subjects...');
        const subjects = await Subject.bulkCreate([
            { name: 'Data Structures', code: 'BCS301', department: 'CS', semester: '3', credits: 4 },
            { name: 'Digital Electronics', code: 'BCS302', department: 'CS', semester: '3', credits: 3 },
            { name: 'Computer Organization', code: 'BCS303', department: 'CS', semester: '3', credits: 4 },
            { name: 'Discrete Mathematics', code: 'BCS304', department: 'CS', semester: '3', credits: 4 }
        ]);
        console.log(`✓ Created ${subjects.length} subjects`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nDefault credentials:');
        console.log('Principal: PRINCIPAL / password');
        console.log('HOD:       HOD001 / password');
        console.log('Faculty:   FAC001 / password (and FAC002-FAC005)');
        console.log('\n📝 Note: Add student data using your provided data file\n');

    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    sequelize.authenticate()
        .then(() => {
            console.log('✓ Database connected');
            return seedDatabase();
        })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = seedDatabase;
