const { Student, Subject, CIEMark } = require('../models');
const sequelize = require('../config/database');

// Data from mockData.js
const englishMarks = [
    15, 2, 10, 33, 40, 32, 48, 21, 36, 42,
    24, 21, 35, 20, 47, 45, 26, 41, 45, 39,
    38, 35, 28, 15, 36, 48, 48, 35, 48, 28,
    35, 35, 'Ab', 36, 9, 29, 26, 28, 18, 46,
    29, 20, 20, 41, 29, 40, 'Ab', 9, 23, 15,
    9, 23, 35, 33, 49, 35, 30, 'Ab', 'Ab', 23,
    42, 'Ab', 21
];

const mathsMarks = [
    { cie1: 19, cie2: 1 }, { cie1: 8, cie2: 0 }, { cie1: 8, cie2: 0 }, { cie1: 34, cie2: 3 },
    { cie1: 35, cie2: 14 }, { cie1: 35, cie2: 15 }, { cie1: 35, cie2: 11 }, { cie1: 10, cie2: 0 },
    { cie1: 32, cie2: 15 }, { cie1: 35, cie2: 15 }, { cie1: 16, cie2: 0 }, { cie1: 34, cie2: 6 },
    { cie1: 35, cie2: 4 }, { cie1: 7, cie2: 0 }, { cie1: 28, cie2: 11 }, { cie1: 32, cie2: 11 },
    { cie1: 16, cie2: 4 }, { cie1: 29, cie2: 0 }, { cie1: 35, cie2: 15 }, { cie1: 21, cie2: 0 },
    { cie1: 28, cie2: 10 }, { cie1: 34, cie2: 15 }, { cie1: 34, cie2: 15 }, { cie1: 15, cie2: 0 },
    { cie1: 27, cie2: 4 }, { cie1: 35, cie2: 11 }, { cie1: 35, cie2: 15 }, { cie1: 13, cie2: 0 },
    { cie1: 32, cie2: 15 }, { cie1: 5, cie2: 0 }, { cie1: 20, cie2: 0 }, { cie1: 33, cie2: 15 },
    { cie1: 'Ab', cie2: 'Ab' }, { cie1: 35, cie2: 14 }, { cie1: 1, cie2: 0 }, { cie1: 34, cie2: 14 },
    { cie1: 26, cie2: 4 }, { cie1: 10, cie2: 0 }, { cie1: 2, cie2: 0 }, { cie1: 35, cie2: 14 },
    { cie1: 30, cie2: 15 }, { cie1: 5, cie2: 0 }, { cie1: 13, cie2: 0 }, { cie1: 35, cie2: 14 },
    { cie1: 25, cie2: 6 }, { cie1: 35, cie2: 14 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 15, cie2: 0 },
    { cie1: 7, cie2: 0 }, { cie1: 6, cie2: 0 }, { cie1: 6, cie2: 0 }, { cie1: 33, cie2: 4 },
    { cie1: 34, cie2: 14 }, { cie1: 20, cie2: 0 }, { cie1: 30, cie2: 0 }, { cie1: 35, cie2: 15 },
    { cie1: 35, cie2: 13 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 31, cie2: 14 },
    { cie1: 33, cie2: 12 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 10, cie2: 0 }
];

const caegMarks = [
    { cie1: 8, cie2: 22 }, { cie1: 5, cie2: 6 }, { cie1: 4, cie2: 6 }, { cie1: 10, cie2: 38 },
    { cie1: 8, cie2: 36 }, { cie1: 8, cie2: 37 }, { cie1: 9, cie2: 30 }, { cie1: 4, cie2: 8 },
    { cie1: 6, cie2: 35 }, { cie1: 5, cie2: 34 }, { cie1: 6, cie2: 2 }, { cie1: 10, cie2: 12 },
    { cie1: 9, cie2: 35 }, { cie1: 5, cie2: 18 }, { cie1: 8, cie2: 29 }, { cie1: 5, cie2: 32 },
    { cie1: 6, cie2: 36 }, { cie1: 10, cie2: 29 }, { cie1: 10, cie2: 39 }, { cie1: 8, cie2: 34 },
    { cie1: 8, cie2: 23 }, { cie1: 8, cie2: 36 }, { cie1: 6, cie2: 35 }, { cie1: 6, cie2: 28 },
    { cie1: 5, cie2: 17 }, { cie1: 6, cie2: 39 }, { cie1: 9, cie2: 38 }, { cie1: 5, cie2: 13 },
    { cie1: 9, cie2: 39 }, { cie1: 5, cie2: 7 }, { cie1: 0, cie2: 18 }, { cie1: 9, cie2: 36 },
    { cie1: 'Ab', cie2: 'Ab' }, { cie1: 8, cie2: 32 }, { cie1: 4, cie2: 0 }, { cie1: 6, cie2: 38 },
    { cie1: 8, cie2: 24 }, { cie1: 6, cie2: 14 }, { cie1: 4, cie2: 0 }, { cie1: 6, cie2: 24 },
    { cie1: 8, cie2: 37 }, { cie1: 6, cie2: 24 }, { cie1: 2, cie2: 8 }, { cie1: 8, cie2: 35 },
    { cie1: 6, cie2: 30 }, { cie1: 8, cie2: 28 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 6, cie2: 27 },
    { cie1: 5, cie2: 16 }, { cie1: 5, cie2: 16 }, { cie1: 6, cie2: 24 }, { cie1: 8, cie2: 36 },
    { cie1: 8, cie2: 33 }, { cie1: 6, cie2: 28 }, { cie1: 6, cie2: 30 }, { cie1: 7, cie2: 24 },
    { cie1: 0, cie2: 18 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 8, cie2: 36 },
    { cie1: 6, cie2: 32 }, { cie1: 'Ab', cie2: 'Ab' }, { cie1: 6, cie2: 18 }
];

const csStudents = [
    { regNo: '459CS25001', name: 'A KAVITHA' },
    { regNo: '459CS25002', name: 'ABHISHEKA' },
    { regNo: '459CS25003', name: 'ADARSH REDDY G' },
    { regNo: '459CS25004', name: 'AGASARA KEERTHANA' },
    { regNo: '459CS25005', name: 'AKHIL S' },
    { regNo: '459CS25006', name: 'AKULA SHASHI KUMAR' },
    { regNo: '459CS25007', name: 'ANAPA LEELA LASYA LAHARI' },
    { regNo: '459CS25008', name: 'ANKITH C' },
    { regNo: '459CS25009', name: 'ANUSHA' },
    { regNo: '459CS25010', name: 'B GURU SAI CHARAN' },
    { regNo: '459CS25011', name: 'B SREENATH' },
    { regNo: '459CS25012', name: 'B VAMSHI' },
    { regNo: '459CS25013', name: 'BASAVARAJA' },
    { regNo: '459CS25014', name: 'BEBE KHUTEJA' },
    { regNo: '459CS25015', name: 'BHUMIKA K' },
    { regNo: '459CS25016', name: 'C ABHINAV' },
    { regNo: '459CS25017', name: 'C D ANNAPOORNA' },
    { regNo: '459CS25018', name: 'C JEEVAN KUMAR' },
    { regNo: '459CS25019', name: 'D LIKHITA' },
    { regNo: '459CS25020', name: 'D PREM KUMAR' },
    { regNo: '459CS25021', name: 'D S YASHODA' },
    { regNo: '459CS25022', name: 'DARSHANI' },
    { regNo: '459CS25023', name: 'DARUR KAVYA' },
    { regNo: '459CS25024', name: 'DASHAVANTH' },
    { regNo: '459CS25025', name: 'DHANESHWARI' },
    { regNo: '459CS25026', name: 'FIRDOUS D' },
    { regNo: '459CS25027', name: 'G ANUSRI' },
    { regNo: '459CS25028', name: 'G M VISHWANATH' },
    { regNo: '459CS25029', name: 'GAGANA PATIL' },
    { regNo: '459CS25030', name: 'GANGULA KUSHAL SAI' },
    { regNo: '459CS25031', name: 'GOUTHAM HEGADE K S' },
    { regNo: '459CS25032', name: 'GOUTHAMI' },
    { regNo: '459CS25033', name: 'GULAM MUSTAFA KHAN' },
    { regNo: '459CS25034', name: 'H D NANDISH NAIK' },
    { regNo: '459CS25035', name: 'H VINAYA PATIL' },
    { regNo: '459CS25036', name: 'HALLI SIDDANA GOUDU' },
    { regNo: '459CS25037', name: 'HANUMANTHA REDDY' },
    { regNo: '459CS25038', name: 'HARI CHARAN K' },
    { regNo: '459CS25039', name: 'HEMANT DWIVEDI' },
    { regNo: '459CS25040', name: 'J SHIVASHANKAR' },
    { regNo: '459CS25041', name: 'K ABHILASH' },
    { regNo: '459CS25042', name: 'K ANANDA' },
    { regNo: '459CS25043', name: 'K HARI PRASAD REDDY' },
    { regNo: '459CS25044', name: 'K JASHWANTH GOWDA' },
    { regNo: '459CS25045', name: 'K JEETHENDRA REDDY' },
    { regNo: '459CS25046', name: 'K KAVYA' },
    { regNo: '459CS25047', name: 'K M MEGHANA' },
    { regNo: '459CS25048', name: 'K MOUNIKA' },
    { regNo: '459CS25049', name: 'K PRAVEEN KUMAR' },
    { regNo: '459CS25050', name: 'K THARUN' },
    { regNo: '459CS25051', name: 'K VINAY' },
    { regNo: '459CS25052', name: 'KEERTHANA M' },
    { regNo: '459CS25053', name: 'KYADHARI KAVYASRI' },
    { regNo: '459CS25054', name: 'LAKSHA R' },
    { regNo: '459CS25055', name: 'LAKSHMI S' },
    { regNo: '459CS25056', name: 'M AAMIR HAMZA' },
    { regNo: '459CS25057', name: 'M MAHESHA' },
    { regNo: '459CS25058', name: 'M S MOHAMMAD ISMAIL' },
    { regNo: '459CS25059', name: 'M S POORVI' },
    { regNo: '459CS25060', name: 'MAHADEVI V' },
    { regNo: '459CS25061', name: 'MANEESHA V M' },
    { regNo: '459CS25062', name: 'MARESHA Y' },
    { regNo: '459CS25063', name: 'MARUTHI H' }
];

const mathsAttendance = [
    87, 62, 44, 94, 94, 100, 88, 50, 100, 94,
    69, 88, 75, 75, 69, 81, 100, 100, 100, 88,
    75, 88, 81, 81, 94, 76, 94, 81, 88, 81,
    81, 100, 44, 88, 100, 100, 94, 69, 31, 100,
    100, 81, 50, 81, 94, 94, 0, 63, 63, 63,
    69, 81, 81, 69, 81, 81, 100, 44, 0, 81,
    81, 0, 100
];

const englishAttendance = [
    62, 18, 27, 83, 89, 77, 71, 33, 83, 83,
    50, 71, 68, 34, 65, 68, 86, 95, 89, 59,
    77, 77, 56, 62, 77, 48, 77, 77, 83, 71,
    53, 83, 12, 74, 92, 92, 89, 50, 18, 89,
    83, 53, 36, 83, 83, 74, 0, 56, 33, 59,
    39, 39, 74, 48, 71, 95, 95, 18, 0, 89,
    71, 12, 65
];

const caegAttendance = [
    81, 53, 43, 100, 100, 91, 96, 57, 100, 91,
    81, 81, 81, 72, 72, 76, 91, 100, 100, 72,
    81, 100, 81, 81, 81, 62, 91, 81, 100, 91,
    81, 100, 0, 100, 100, 100, 100, 71, 24, 100,
    100, 91, 52, 91, 100, 81, 0, 57, 71, 62,
    71, 81, 71, 81, 91, 86, 91, 29, 0, 91,
    91, 0, 100
];

const pythonAttendance = [
    96, 86, 40, 96, 96, 100, 96, 67, 100, 84,
    55, 56, 84, 80, 96, 100, 100, 100, 100, 91,
    100, 96, 80, 76, 96, 96, 100, 90, 90, 87,
    100, 100, 35, 80, 100, 100, 100, 80, 30, 100,
    100, 72, 71, 100, 100, 100, 0, 76, 75, 76,
    80, 92, 80, 87, 100, 100, 100, 68, 0, 100,
    87, 45, 100
];

async function seedMarks() {
    try {
        console.log('Seeding Real Marks...');

        const subjects = await Subject.findAll();

        const englishSub = subjects.find(s => s.name.includes('Communication') || s.name.includes('English'));
        const mathsSub = subjects.find(s => s.name.includes('Maths'));
        const caegSub = subjects.find(s => s.name.includes('CAEG') || s.name.includes('Graphics'));
        const pythonSub = subjects.find(s => s.name.includes('Python') || s.name.includes('Programming'));

        if (!englishSub || !mathsSub || !caegSub || !pythonSub) {
            console.error('Subjects not found in DB. Make sure subjects are seeded first.');
            console.log('English:', englishSub?.name);
            console.log('Maths:', mathsSub?.name);
            console.log('CAEG:', caegSub?.name);
            console.log('Python:', pythonSub?.name);
            return;
        }

        console.log(`Found Subjects: ${englishSub.name}, ${mathsSub.name}, ${caegSub.name}`);

        // Update CAEG Max Marks to 50
        if (caegSub.maxMarks !== 50) {
            caegSub.maxMarks = 50;
            await caegSub.save();
            console.log('Updated CAEG Subject Max Marks to 50');
        }

        for (let i = 0; i < csStudents.length; i++) {
            const studentData = csStudents[i];

            let student = await Student.findOne({ where: { regNo: studentData.regNo } });

            if (!student) {
                console.log(`Creating student: ${studentData.name}`);
                student = await Student.create({
                    regNo: studentData.regNo,
                    name: studentData.name,
                    department: 'CS',
                    semester: '2',
                    section: 'A'
                });
            }

            // --- Seed English Marks (CIE-1 Only) ---
            const engMarkVal = englishMarks[i];
            if (engMarkVal !== undefined) {
                const score = engMarkVal === 'Ab' ? 0 : engMarkVal;

                // Delete existing first to ensure update
                await CIEMark.destroy({
                    where: { studentId: student.id, subjectId: englishSub.id }
                });

                // Create new
                await CIEMark.create({
                    studentId: student.id,
                    subjectId: englishSub.id,
                    cieType: 'CIE1',
                    marks: score,
                    maxMarks: 50,
                    status: 'APPROVED',
                    attendance: englishAttendance[i] !== undefined ? englishAttendance[i] : (Math.floor(Math.random() * (95 - 65 + 1)) + 65)
                });
            }

            // --- Seed Maths Marks (CIE-1 = CO1 + CO2) ---
            const mathMarkVal = mathsMarks[i];
            if (mathMarkVal) {
                const cie1Val = mathMarkVal.cie1 === 'Ab' ? 0 : mathMarkVal.cie1;
                const cie2Val = mathMarkVal.cie2 === 'Ab' ? 0 : mathMarkVal.cie2;
                const totalMaths = cie1Val + cie2Val;

                // Delete existing first
                await CIEMark.destroy({
                    where: { studentId: student.id, subjectId: mathsSub.id }
                });

                await CIEMark.create({
                    studentId: student.id,
                    subjectId: mathsSub.id,
                    cieType: 'CIE1',
                    marks: totalMaths,
                    maxMarks: 50,
                    status: 'APPROVED',
                    attendance: mathsAttendance[i] !== undefined ? mathsAttendance[i] : (Math.floor(Math.random() * (100 - 75 + 1)) + 75)
                });
            }

            // --- Seed CAEG Marks (CIE-1 = CO1 + CO2) ---
            const caegMarkVal = caegMarks[i];
            if (caegMarkVal) {
                const cie1Val = caegMarkVal.cie1 === 'Ab' ? 0 : caegMarkVal.cie1;
                const cie2Val = caegMarkVal.cie2 === 'Ab' ? 0 : caegMarkVal.cie2;
                const totalCaeg = cie1Val + cie2Val;

                // Delete existing first
                await CIEMark.destroy({
                    where: { studentId: student.id, subjectId: caegSub.id }
                });

                await CIEMark.create({
                    studentId: student.id,
                    subjectId: caegSub.id,
                    cieType: 'CIE1',
                    marks: totalCaeg,
                    maxMarks: 50,
                    status: 'APPROVED',
                    attendance: caegAttendance[i] !== undefined ? caegAttendance[i] : (Math.floor(Math.random() * (100 - 75 + 1)) + 75)
                });
            }

            // --- Seed Python Marks (Random Marks + Real Attendance) ---
            if (pythonSub) {
                // Delete existing first
                await CIEMark.destroy({
                    where: { studentId: student.id, subjectId: pythonSub.id }
                });

                // Generate random mark between 5 and 48 to ensure some low performers (< 20)
                const randomMark = Math.floor(Math.random() * (48 - 5 + 1)) + 5;

                await CIEMark.create({
                    studentId: student.id,
                    subjectId: pythonSub.id,
                    cieType: 'CIE1',
                    marks: randomMark,
                    maxMarks: 50,
                    status: 'APPROVED',
                    attendance: pythonAttendance[i] !== undefined ? pythonAttendance[i] : (Math.floor(Math.random() * (100 - 75 + 1)) + 75)
                });
            }
        }

        console.log('✅ Real marks seeded successfully!');

    } catch (error) {
        console.error('Error seeding marks:', error);
    }
}

// Run if called directly
if (require.main === module) {
    sequelize.authenticate()
        .then(() => seedMarks())
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
