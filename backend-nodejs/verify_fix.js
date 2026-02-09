const sequelize = require('./src/config/database');
const { Student, Subject, CIEMark } = require('./src/models');
const { Op } = require('sequelize');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Find KAVITHA
        const student = await Student.findOne({
            where: { regNo: '459CS25001' }
        });

        if (!student) {
            console.log("Student 459CS25001 NOT FOUND in DB!");
            // Check if ANY student exists with that name?
            const byName = await Student.findOne({ where: { name: 'A KAVITHA' } });
            if (byName) console.log("Found by name:", byName.toJSON());
            return;
        }

        console.log("Student Found:", student.toJSON());
        console.log(`Department: '${student.department}'`);
        console.log(`Semester: '${student.semester}'`);

        // 2. Find Subject
        const subject = await Subject.findOne({
            where: { name: { [Op.like]: '%Maths%' } }
        });
        if (!subject) {
            console.log("Maths Subject Not Found");
        } else {
            console.log(`Subject: ${subject.name} (ID: ${subject.id})`);

            // 3. Find Marks
            const marks = await CIEMark.findAll({
                where: {
                    studentId: student.id,
                    subjectId: subject.id
                }
            });
            console.log(`Marks Found: ${marks.length}`);
            if (marks.length > 0) console.log(marks[0].toJSON());
            else console.log("NO MARKS for this student/subject.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

verify();
