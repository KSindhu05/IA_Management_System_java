const fs = require('fs');
const path = require('path');
const sequelize = require('./src/config/database');
const { Student, Subject, CIEMark } = require('./src/models');
const { Op } = require('sequelize');

async function importMarks() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Read CSV
        const csvPath = path.join(__dirname, 'student_data.csv');
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);

        // Header: Reg No,Student Name,Subject,CIE-1 Marks,Attendance,Parent Phone
        // Skip header
        const dataLines = lines.slice(1);

        console.log(`Found ${dataLines.length} rows in CSV.`);

        let successCount = 0;
        let failCount = 0;

        for (const line of dataLines) {
            const cols = line.split(',').map(c => c.trim());
            if (cols.length < 5) continue;

            const regNo = cols[0];
            const subjectName = cols[2];
            const marksRaw = cols[3];
            const attendanceRaw = cols[4];

            // Handle Marks
            let marks = 0;
            if (marksRaw === 'A' || marksRaw === 'AB') {
                marks = 0; // Absent
            } else {
                marks = parseInt(marksRaw);
                if (isNaN(marks)) marks = 0;
            }

            // Handle Attendance
            let attendance = parseInt(attendanceRaw);
            if (isNaN(attendance)) attendance = 0;

            // Find Student
            const student = await Student.findOne({ where: { regNo } });
            if (!student) {
                console.log(`Student not found: ${regNo}`);
                failCount++;
                continue;
            }

            // Find Subject
            // CSV names: "Engineering Maths-II", "English Communication", "CAEG", "Python"
            // DB names might vary slightly, so use Like if exact fails?
            let subject = await Subject.findOne({ where: { name: subjectName } });
            if (!subject) {
                // Try LIKE match
                subject = await Subject.findOne({ where: { name: { [Op.like]: `${subjectName}%` } } });
            }

            if (!subject) {
                console.log(`Subject not found: ${subjectName}`);
                failCount++;
                continue;
            }

            // Upsert Mark
            // CIE-1 Marks from CSV --> cieType: 'CIE1'
            // Check if exists
            const existing = await CIEMark.findOne({
                where: {
                    studentId: student.id,
                    subjectId: subject.id,
                    cieType: 'CIE1'
                }
            });

            if (existing) {
                existing.marks = marks;
                existing.attendance = attendance;
                existing.status = 'PENDING'; // Ensure editable
                await existing.save();
            } else {
                await CIEMark.create({
                    studentId: student.id,
                    subjectId: subject.id,
                    marks: marks,
                    maxMarks: 50,
                    cieType: 'CIE1',
                    attendance: attendance,
                    status: 'PENDING'
                });
            }
            successCount++;
        }

        console.log(`Import Completed.`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        // process.exit(0); // wait a bit
        setTimeout(() => process.exit(0), 1000);
    }
}

importMarks();
