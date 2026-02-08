const fs = require('fs');
const bcrypt = require('bcryptjs');
const { User, Student, Subject, CIEMark } = require('./src/models');
const sequelize = require('./src/config/database');

async function importStudents() {
    try {
        console.log('\n📥 Starting student data import...\n');

        // Read CSV file
        const csvData = fs.readFileSync('./student_data.csv', 'utf-8');
        const lines = csvData.split('\n').slice(1); // Skip header

        // Parse CSV data
        const records = [];
        const studentMap = new Map();

        for (const line of lines) {
            if (!line.trim()) continue;

            const [regNo, name, subject, marksStr, attendanceStr, phone] = line.split(',');

            // Parse marks (handle 'A', 'AB' as null)
            const marks = (marksStr === 'A' || marksStr === 'AB' || marksStr === 'null') ? null : parseFloat(marksStr);
            const attendance = (attendanceStr === 'A' || attendanceStr === 'AB') ? 0 : parseInt(attendanceStr);

            records.push({
                regNo: regNo.trim(),
                name: name.trim(),
                subject: subject.trim(),
                marks,
                attendance,
                phone: phone.trim()
            });

            // Track unique students
            if (!studentMap.has(regNo.trim())) {
                studentMap.set(regNo.trim(), {
                    name: name.trim(),
                    phone: phone.trim()
                });
            }
        }

        console.log(`✓ Parsed ${records.length} records for ${studentMap.size} students\n`);

        // Update subjects to match data
        console.log('Creating/updating subjects...');
        const subjectNames = ['Engineering Maths-II', 'English Communication', 'CAEG', 'Python'];
        const subjectMap = new Map();

        for (const subjectName of subjectNames) {
            const [subject] = await Subject.findOrCreate({
                where: { name: subjectName },
                defaults: {
                    name: subjectName,
                    code: subjectName.replace(/\s/g, '').substring(0, 6).toUpperCase(),
                    department: 'CS',
                    semester: '2',
                    credits: 4
                }
            });
            subjectMap.set(subjectName, subject);
        }
        console.log(`✓ ${subjectNames.length} subjects ready\n`);

        // Create students and users
        console.log('Creating students and user accounts...');
        const password = await bcrypt.hash('password', 10);
        let studentCount = 0;

        for (const [regNo, info] of studentMap) {
            // Create User
            const [user] = await User.findOrCreate({
                where: { username: regNo },
                defaults: {
                    username: regNo,
                    password,
                    role: 'STUDENT',
                    associatedId: regNo,
                    fullName: info.name
                }
            });

            // Create Student
            await Student.findOrCreate({
                where: { regNo },
                defaults: {
                    regNo,
                    name: info.name,
                    department: 'CS',
                    semester: '2',
                    section: 'A',
                    phoneNo: info.phone,
                    email: `${regNo.toLowerCase()}@student.college.edu`,
                    userId: user.id
                }
            });

            studentCount++;
            if (studentCount % 10 === 0) {
                console.log(`  Created ${studentCount} students...`);
            }
        }
        console.log(`✓ Created ${studentCount} students with user accounts\n`);

        // Create marks records
        console.log('Importing marks and attendance...');
        let marksCount = 0;

        for (const record of records) {
            const student = await Student.findOne({ where: { regNo: record.regNo } });
            const subject = subjectMap.get(record.subject);

            if (student && subject) {
                await CIEMark.findOrCreate({
                    where: { studentId: student.id, subjectId: subject.id },
                    defaults: {
                        studentId: student.id,
                        subjectId: subject.id,
                        marks: record.marks,
                        maxMarks: 50,
                        attendance: record.attendance,
                        status: 'APPROVED'
                    }
                });
                marksCount++;
            }

            if (marksCount % 50 === 0) {
                console.log(`  Imported ${marksCount} marks records...`);
            }
        }

        console.log(`✓ Imported ${marksCount} marks records\n`);

        console.log('✅ Student data import complete!\n');
        console.log(`Summary:`);
        console.log(`- ${studentCount} students created`);
        console.log(`- ${marksCount} marks records imported`);
        console.log(`- All students can login with regNo as username and 'password' as password\n`);

    } catch (error) {
        console.error('❌ Import error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    sequelize.authenticate()
        .then(() => {
            console.log('✓ Database connected');
            return importStudents();
        })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = importStudents;
