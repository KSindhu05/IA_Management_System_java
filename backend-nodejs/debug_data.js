const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const Student = sequelize.define('Student', {
    regNo: { type: DataTypes.STRING, unique: true },
    name: DataTypes.STRING,
    department: DataTypes.STRING,
    semester: DataTypes.STRING,
    section: DataTypes.STRING
});

const Subject = sequelize.define('Subject', {
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    department: DataTypes.STRING,
    semester: DataTypes.STRING
});

const CIEMark = sequelize.define('CIEMark', {
    studentId: DataTypes.INTEGER,
    subjectId: DataTypes.INTEGER,
    cieType: DataTypes.STRING, // 'CIE1', 'CIE2'
    marks: DataTypes.INTEGER,
    status: DataTypes.STRING
});

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Check Students in CS
        const students = await Student.findAll({ where: { department: 'Computer Science & Engineering' } });
        console.log(`\nFound ${students.length} CS Students.`);
        if (students.length > 0) {
            console.log('Sample Student:', JSON.stringify(students[0], null, 2));
            const nullSem = students.filter(s => !s.semester);
            console.log(`Students with null semester: ${nullSem.length}`);
            if (nullSem.length > 0) {
                console.log('Sample null sem:', nullSem[0].name, nullSem[0].regNo);
            }
        }

        // 2. Find Engineering Maths-II Subject
        const subject = await Subject.findOne({ where: { name: 'Engineering Maths-II' } });
        if (!subject) {
            console.log('\nSubject "Engineering Maths-II" not found!');
            return;
        }
        console.log(`\nSubject Found: ${subject.name} (ID: ${subject.id})`);

        // 3. Check Marks for this Subject
        const marks = await CIEMark.findAll({ where: { subjectId: subject.id } });
        console.log(`Found ${marks.length} marks for this subject.`);

        if (marks.length > 0) {
            console.log('Sample Mark:', JSON.stringify(marks[0], null, 2));

            // Check correlation
            const studentIds = students.map(s => s.id);
            const marksForStudents = marks.filter(m => studentIds.includes(m.studentId));
            console.log(`Marks matching fetched CS students: ${marksForStudents.length}`);
        } else {
            console.log('NO MARKS found for this subject. This explains why data is missing.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
