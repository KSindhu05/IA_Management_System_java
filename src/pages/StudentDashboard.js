import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { LayoutDashboard, FileText, Calendar, Book, User, Download, Upload, Bell, TrendingUp, Award, Clock, CheckCircle, Mail, MapPin, Filter, ChevronDown } from 'lucide-react';
import styles from './StudentDashboard.module.css';

// --- DATA DEFINITIONS ---

const studentInfo = {
    name: 'A KAVITHA',
    rollNo: '459CS25001',
    branch: 'Computer Science',
    semester: '2nd',
    attendance: 87,
    cgpa: 9.0,
};

// --- SOPHISTICATED MOCK DATA FOR CIE MARKS (SEM 1-6) ---
const semesterData = {
    1: {
        theory: [
            { code: '20CS11T', subject: 'Engg Mathematics-I', ia1: 18, ia2: 19, ia3: 17, assignment: 9, total: 44 },
            { code: '20CS12T', subject: 'Applied Science', ia1: 15, ia2: 16, ia3: 18, assignment: 8, total: 41 },
            { code: '20CS13T', subject: 'Concepts of Electrical', ia1: 20, ia2: 19, ia3: 20, assignment: 10, total: 49 },
            { code: '20CS14T', subject: 'Applied Electronics', ia1: 12, ia2: 14, ia3: 15, assignment: 7, total: 38 },
        ],
        labs: [
            { code: '20CS16P', subject: 'Basic Electronics Lab', skill1: 22, skill2: 24, record: 10, total: 56 },
            { code: '20CS17P', subject: 'Computer Fundamentals', skill1: 25, skill2: 23, record: 10, total: 58 },
            { code: '20CS18P', subject: 'Science Lab', skill1: 20, skill2: 21, record: 9, total: 50 },
        ]
    },
    2: {
        theory: [
            { code: '20CS21T', subject: 'Engg Mathematics-II', ia1: 16, ia2: 18, ia3: 19, assignment: 9, total: 43 },
            { code: '20CS22T', subject: 'English Comm', ia1: 19, ia2: 20, ia3: 20, assignment: 10, total: 49 },
            { code: '20CS23T', subject: 'Digital Electronics', ia1: 14, ia2: 15, ia3: 13, assignment: 8, total: 39 },
            { code: '20CS24T', subject: 'C Programming', ia1: 20, ia2: 20, ia3: 20, assignment: 10, total: 50 },
        ],
        labs: [
            { code: '20CS26P', subject: 'Multimedia Lab', skill1: 23, skill2: 24, record: 9, total: 56 },
            { code: '20CS27P', subject: 'C Programming Lab', skill1: 25, skill2: 25, record: 10, total: 60 },
        ]
    },
    3: {
        theory: [
            { code: '20CS31T', subject: 'Data Structures', ia1: 15, ia2: 16, ia3: 18, assignment: 8, total: 42 },
            { code: '20CS32T', subject: 'Computer Networks', ia1: 18, ia2: 19, ia3: 17, assignment: 9, total: 45 },
            { code: '20CS33T', subject: 'Operating Systems', ia1: 14, ia2: 15, ia3: 16, assignment: 7, total: 40 },
            { code: '20CS34T', subject: 'Java Programming', ia1: 19, ia2: 18, ia3: 20, assignment: 10, total: 48 },
        ],
        labs: [
            { code: '20CS36P', subject: 'Data Structure Lab', skill1: 24, skill2: 22, record: 9, total: 55 },
            { code: '20CS37P', subject: 'Java Lab', skill1: 25, skill2: 24, record: 10, total: 59 },
        ]
    },
    4: {
        theory: [
            { code: '20CS41T', subject: 'Software Engineering', ia1: 17, ia2: 18, ia3: 19, assignment: 9, total: 45 },
            { code: '20CS42T', subject: 'DBMS', ia1: 16, ia2: 15, ia3: 17, assignment: 8, total: 42 },
            { code: '20CS43T', subject: 'OOPs with C++', ia1: 20, ia2: 19, ia3: 20, assignment: 10, total: 49 },
            { code: '20CS44T', subject: 'Prof. Ethics', ia1: 18, ia2: 18, ia3: 18, assignment: 9, total: 45 },
        ],
        labs: [
            { code: '20CS46P', subject: 'DBMS Lab', skill1: 23, skill2: 24, record: 10, total: 57 },
            { code: '20CS47P', subject: 'C++ Lab', skill1: 22, skill2: 21, record: 9, total: 52 },
        ]
    },
    5: {
        theory: [
            { code: '20CS51T', subject: 'Design & Analysis of Algo', ia1: 22, ia2: 20, ia3: 23, assignment: 10, total: 48 },
            { code: '20CS52T', subject: 'Web Development', ia1: 18, ia2: 19, ia3: 20, assignment: 9, total: 46 },
            { code: '20CS53T', subject: 'Cloud Computing', ia1: 15, ia2: 17, ia3: 18, assignment: 8, total: 42 },
        ],
        labs: [
            { code: '20CS56P', subject: 'Web Dev Lab', skill1: 24, skill2: 25, record: 10, total: 59 },
            { code: '20CS57P', subject: 'Python Lab', skill1: 22, skill2: 23, record: 9, total: 54 },
            { code: '20CS58P', subject: 'Mini Project', skill1: 25, skill2: 25, record: 10, total: 60 }
        ]
    },
    6: {
        theory: [
            { code: '20CS61T', subject: 'Cyber Security', ia1: 0, ia2: 0, ia3: 0, assignment: 0, total: 0 },
        ],
        labs: [
            { code: '20CS66P', subject: 'Major Project', skill1: 0, skill2: 0, record: 0, total: 0 },
            { code: '20CS67P', subject: 'Internship', skill1: 0, skill2: 0, record: 0, total: 0 },
        ]
    }
};

const upcomingExams = [
    { id: 1, exam: 'CIE-3', subject: 'Engineering Maths-II', date: '15-Dec', time: '10:00 AM' },
    { id: 2, exam: 'CIE-3', subject: 'Python', date: '16-Dec', time: '02:00 PM' },
    { id: 3, exam: 'CIE-3', subject: 'CAEG', date: '17-Dec', time: '10:00 AM' },
];

const notifications = [
    { id: 1, message: 'New CIE-5 Marks Uploaded for CAD', time: '2 hrs ago', type: 'info' },
    { id: 2, message: 'Parent Meeting Scheduled for 20th Dec', time: '1 day ago', type: 'warning' },
    { id: 3, message: 'CIE-6 Submission Deadline Tomorrow', time: '2 days ago', type: 'alert' },
];

const attendanceData = [
    { id: 1, subject: 'Engineering Maths-II', total: 45, attended: 40, percentage: 88, status: 'Great' },
    { id: 2, subject: 'CAEG', total: 42, attended: 32, percentage: 76, status: 'Good' },
    { id: 3, subject: 'Python', total: 40, attended: 28, percentage: 70, status: 'Average' },
    { id: 4, subject: 'CS (Communication Skills)', total: 44, attended: 42, percentage: 95, status: 'Excellent' },
    { id: 5, subject: 'Indian Constitution (IC)', total: 38, attended: 25, percentage: 65, status: 'Warning' },
];

const subjectsList = [
    { code: '25SC01T', name: 'Engineering Maths-II', faculty: 'Miss Manju Sree' },
    { code: '25ME02P', name: 'CAEG', faculty: 'Ramesh Gouda' },
    { code: '25CS21P', name: 'Python', faculty: 'Wahida Banu / Sunil Babu H' },
    { code: '25EG01T', name: 'CS (Communication Skills)', faculty: 'Nasrin Banu' },
    { code: '25IC01T', name: 'Indian Constitution (IC)', faculty: 'Wahida Banu / Shreedar Singh' },
];

const facultyList = [
    { id: 1, name: 'Miss Manju Sree', dept: 'Science/Maths', email: 'manju.s@college.edu', cabin: 'Sci-101', subjects: ['Engg Maths-II'] },
    { id: 2, name: 'Ramesh Gouda', dept: 'Mechanical', email: 'ramesh.g@college.edu', cabin: 'Mech-202', subjects: ['CAEG'] },
    { id: 3, name: 'Wahida Banu', dept: 'Computer Science', email: 'wahida.b@college.edu', cabin: 'CS-301', subjects: ['Python', 'IC'] },
    { id: 4, name: 'Nasrin Banu', dept: 'English', email: 'nasrin.b@college.edu', cabin: 'Hum-105', subjects: ['Communication Skills', 'CS'] },
    { id: 5, name: 'Sunil Babu H', dept: 'Computer Science', email: 'sunil.b@college.edu', cabin: 'CS-302', subjects: ['Python'] },
    { id: 6, name: 'Shreedar Singh', dept: 'humanities', email: 'shreedar.s@college.edu', cabin: 'Hum-102', subjects: ['IC'] },
];

// --- COMPONENT ---

const StudentDashboard = () => {
    const [activeSection, setActiveSection] = useState('Overview');
    const [toast, setToast] = useState({ show: false, message: '' });

    // API State
    const [realMarks, setRealMarks] = useState([]);
    const [realSubjects, setRealSubjects] = useState([]);

    React.useEffect(() => {
        // Fallback to Mock Data - align with User's Sheet
        const currentSemSubjects = [
            { name: 'Engineering Maths-II', code: '25SC01T', cie1: 19, cie2: 17 },
            { name: 'CS (Communication Skills)', code: '25EG01T', cie1: 15, cie2: 42 },
            { name: 'Python', code: '25CS21P', cie1: 22, cie2: 24 },
            { name: 'CAEG', code: '25ME02P', cie1: 7, cie2: 18 },
            { name: 'Indian Constitution', code: '25IC01T', cie1: 18, cie2: 19 }
        ];

        const mockRealSubjects = currentSemSubjects.map((s, i) => {
            let cie1Max = 35, cie2Max = 15, totalMax = 50;
            if (s.name === 'English Communication') { cie1Max = 50; cie2Max = 0; }
            else if (s.name === 'CAEG') { cie1Max = 8; cie2Max = 22; totalMax = 30; }
            else if (s.name === 'Python') { cie1Max = 25; cie2Max = 25; }

            return {
                id: i + 1,
                name: s.name,
                code: s.code,
                cie1MaxMarks: cie1Max,
                cie2MaxMarks: cie2Max,
                totalMaxMarks: totalMax,
                department: 'CS'
            };
        });
        setRealSubjects(mockRealSubjects);

        const mockRealMarks = currentSemSubjects.map((s, i) => ({
            subject: { id: i + 1 },
            student: { id: 'me' },
            iaType: 'CIE1',
            cie1Score: s.cie1,
            cie2Score: s.cie2,
            totalScore: s.cie1 + s.cie2,
            attendancePercentage: Math.floor(Math.random() * 15) + 80
        }));
        setRealMarks(mockRealMarks);
    }, []);

    // Filter States
    const [selectedSemester, setSelectedSemester] = useState('5');
    const [selectedCIE, setSelectedCIE] = useState('All');

    const menuItems = [
        { label: 'Overview', path: '/dashboard/student', icon: <LayoutDashboard size={20} />, isActive: activeSection === 'Overview', onClick: () => setActiveSection('Overview') },
        { label: 'CIE Marks', path: '/dashboard/student', icon: <FileText size={20} />, isActive: activeSection === 'CIE Marks', onClick: () => setActiveSection('CIE Marks') },
        { label: 'Attendance', path: '/dashboard/student', icon: <Calendar size={20} />, isActive: activeSection === 'Attendance', onClick: () => setActiveSection('Attendance') },
        { label: 'Subjects', path: '/dashboard/student', icon: <Book size={20} />, isActive: activeSection === 'Subjects', onClick: () => setActiveSection('Subjects') },
        { label: 'Faculty', path: '/dashboard/student', icon: <User size={20} />, isActive: activeSection === 'Faculty', onClick: () => setActiveSection('Faculty') },
    ];

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleDownload = () => {
        window.print();
    };

    const getStatus = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 75) return { label: 'Distinction', color: '#166534', bg: '#dcfce7' };
        if (percentage >= 60) return { label: 'First Class', color: '#1d4ed8', bg: '#dbeafe' };
        if (percentage >= 35) return { label: 'Pass', color: '#0369a1', bg: '#e0f2fe' };
        return { label: 'At Risk', color: '#b91c1c', bg: '#fee2e2' };
    };

    const getRemarks = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 85) return "Excellent performance! Keep it up.";
        if (percentage >= 70) return "Good understanding. Focus on weak areas.";
        if (percentage >= 50) return "Average. Needs more consistent effort.";
        return "Critical: Please meet the faculty.";
    };

    const renderOverview = () => {
        return (
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📑 Current Semester Report</h2>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>CIE-1</th>
                                        <th>CIE-2</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realSubjects.length > 0 ? realSubjects.map((sub) => {
                                        const mark = realMarks.find(m => m.subject.id === sub.id) || {};
                                        const total = mark.totalScore || 0;
                                        const status = getStatus(total, sub.totalMaxMarks);
                                        return (
                                            <tr key={sub.id}>
                                                <td>
                                                    <div className={styles.subjectCell}>
                                                        <span className={styles.subjectName}>{sub.name}</span>
                                                        <span className={styles.subjectCode}>{sub.code}</span>
                                                    </div>
                                                </td>
                                                <td>{mark.cie1Score != null ? mark.cie1Score : '-'} / {sub.cie1MaxMarks}</td>
                                                <td>{mark.cie2Score != null ? mark.cie2Score : '-'} / {sub.cie2MaxMarks}</td>
                                                <td className={styles.avgCell}>
                                                    {total} / {sub.totalMaxMarks}
                                                </td>
                                                <td>
                                                    <span className={styles.badge} style={{ color: status.color, background: status.bg }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>Loading real-time data or no subjects found...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>📅 Upcoming Exams</h2>
                        <div className={styles.examsList}>
                            {upcomingExams.map(exam => (
                                <div key={exam.id} className={styles.examItem}>
                                    <div className={styles.examBadge}>{exam.exam}</div>
                                    <div className={styles.examInfo}>
                                        <span className={styles.examSubject}>{exam.subject}</span>
                                        <span className={styles.examDate}>{exam.date} at {exam.time}</span>
                                    </div>
                                    <Clock size={16} className={styles.examIcon} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>🔔 Notifications</h2>
                        <div className={styles.notificationsList}>
                            {notifications.map(notif => (
                                <div key={notif.id} className={styles.notifItem}>
                                    <div className={`${styles.notifDot} ${styles[notif.type]}`}></div>
                                    <div className={styles.notifContent}>
                                        <p className={styles.notifMessage}>{notif.message}</p>
                                        <span className={styles.notifTime}>{notif.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    const renderCIEMarks = () => {
        const data = semesterData[selectedSemester];

        return (
            <div className={styles.detailsContainer}>
                {/* Print Header - Visible only in Print */}
                <div className={styles.printHeader}>
                    <h1>CIE Performance Report</h1>
                    <p>{studentInfo.name} ({studentInfo.rollNo}) | {studentInfo.branch} | Semester {selectedSemester}</p>
                </div>

                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle} style={{ fontSize: '1.25rem' }}>Semester {selectedSemester} - CIE Performance</h3>
                    <button className={styles.downloadBtn} onClick={handleDownload}>
                        <Download size={16} /> Download Report
                    </button>
                </div>

                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.selectionRow}>
                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>Select Semester:</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {[1, 2, 3, 4, 5, 6].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>

                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>Select CIE / Exam:</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    value={selectedCIE}
                                    onChange={(e) => setSelectedCIE(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    <option value="All">All Internals</option>
                                    <option value="CIE-1">CIE - 1 / Skill Test 1</option>
                                    <option value="CIE-2">CIE - 2 / Skill Test 2</option>
                                    <option value="CIE-3">CIE - 3</option>
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>📘 Theory Subjects</h2>
                        <div className={styles.badge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            Max CIE Marks: 50
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <th>CIE-1</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <th>CIE-2</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-3') && <th>CIE-3</th>}
                                    <th>Activities</th>
                                    <th>Total CIE</th>
                                    <th>Status</th>
                                    <th>Faculty Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.theory.map((item, idx) => {
                                    const status = getStatus(item.total, 50);
                                    const remarks = getRemarks(item.total, 50);
                                    return (
                                        <tr key={idx}>
                                            <td className={styles.codeText}>{item.code}</td>
                                            <td className={styles.subjectText}>{item.subject}</td>
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <td>{item.ia1}</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <td>{item.ia2}</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-3') && <td>{item.ia3}</td>}
                                            <td>{item.assignment}</td>
                                            <td className={styles.totalCell}>{item.total}</td>
                                            <td>
                                                <span className={styles.badge} style={{ color: status.color, background: status.bg }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#6b7280' }}>
                                                {remarks}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>🔬 Lab / Practical Subjects</h2>
                        <div className={styles.badge} style={{ background: '#dcfce7', color: '#15803d' }}>
                            Max CIE Marks: 60
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Lab Code</th>
                                    <th>Lab Name</th>
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <th>Skill Test 1</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <th>Skill Test 2</th>}
                                    <th>Record + Viva</th>
                                    <th>Total CIE</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.labs.length > 0 ? data.labs.map((item, idx) => {
                                    const status = getStatus(item.total, 60);
                                    return (
                                        <tr key={idx}>
                                            <td className={styles.codeText}>{item.code}</td>
                                            <td className={styles.subjectText}>{item.subject}</td>
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <td>{item.skill1}</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <td>{item.skill2}</td>}
                                            <td>{item.record}</td>
                                            <td className={styles.totalCell}>{item.total}</td>
                                            <td>
                                                <span className={styles.badge} style={{ color: status.color, background: status.bg }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                            No Labs for this semester
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendance = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.attendanceGrid}>
                {attendanceData.map(item => (
                    <div key={item.id} className={styles.attendanceCard}>
                        <div className={styles.attendanceHeader}>
                            <h3 className={styles.attendanceSubject}>{item.subject}</h3>
                            <span className={`${styles.badge} ${item.percentage >= 85 ? styles.excellent : item.percentage >= 75 ? styles.good : styles.needsFocus}`}>
                                {item.status}
                            </span>
                        </div>
                        <div className={styles.attendanceCircle}>
                            <span className={styles.attendancePercentage}>{item.percentage}%</span>
                            <span className={styles.attendanceLabel}>Present</span>
                        </div>
                        <div className={styles.attendanceStats}>
                            <div className={styles.attStat}>
                                <span>Total Classes</span>
                                <strong>{item.total}</strong>
                            </div>
                            <div className={styles.attStat}>
                                <span>Attended</span>
                                <strong>{item.attended}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSubjects = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>📚 Registered Subjects</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Subject Name</th>
                                <th>Faculty In-Charge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectsList.map(sub => (
                                <tr key={sub.code}>
                                    <td><span className={styles.codeBadge}>{sub.code}</span></td>
                                    <td style={{ fontWeight: 500 }}>{sub.name}</td>
                                    <td>{sub.faculty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderFaculty = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.facultyGrid}>
                {facultyList.map(f => (
                    <div key={f.id} className={styles.facultyCard}>
                        <div className={styles.facultyAvatar}>
                            <User size={32} color="#4b5563" />
                        </div>
                        <div className={styles.facultyInfo}>
                            <h3 className={styles.facultyName}>{f.name}</h3>
                            <p className={styles.facultyDept}>{f.dept}</p>
                            <div className={styles.facultyMeta}>
                                <div className={styles.metaItem}>
                                    <Mail size={14} /> {f.email}
                                </div>
                                <div className={styles.metaItem}>
                                    <MapPin size={14} /> Cabin: {f.cabin}
                                </div>
                            </div>
                            <div className={styles.facultyTags}>
                                {f.subjects.map(s => (
                                    <span key={s} className={styles.tag}>{s}</span>
                                ))}
                            </div>
                            <button className={styles.msgBtn} onClick={() => showToast(`Message sent to ${f.name}`)}>
                                Send Message
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <DashboardLayout menuItems={menuItems}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.welcomeText}>
                        {activeSection === 'Overview' ? `Welcome, ${studentInfo.name} 👋` : activeSection}
                    </h1>
                    <p className={styles.subtitle}>{studentInfo.branch} | Semester: {studentInfo.semester} | Reg No: {studentInfo.rollNo}</p>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.headerStat}>
                        <TrendingUp size={18} className={styles.statIcon} />
                        <span>CGPA: <strong>{studentInfo.cgpa}</strong></span>
                    </div>
                </div>
            </header>

            {activeSection === 'Overview' && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#dbeafe' }}>
                            <Award size={24} color="#2563eb" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>22/25</span>
                            <span className={styles.statCardLabel}>Avg CIE Score</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#dcfce7' }}>
                            <CheckCircle size={24} color="#16a34a" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>5/6</span>
                            <span className={styles.statCardLabel}>CIEs Completed</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#fef3c7' }}>
                            <Calendar size={24} color="#d97706" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{studentInfo.attendance}%</span>
                            <span className={styles.statCardLabel}>Attendance</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#fce7f3' }}>
                            <Bell size={24} color="#db2777" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{notifications.length}</span>
                            <span className={styles.statCardLabel}>Notifications</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {activeSection === 'Overview' && renderOverview()}
            {activeSection === 'CIE Marks' && renderCIEMarks()}
            {activeSection === 'Attendance' && renderAttendance()}
            {activeSection === 'Subjects' && renderSubjects()}
            {activeSection === 'Faculty' && renderFaculty()}

            {/* Toast */}
            {toast.show && (
                <div className={styles.toast}>
                    <CheckCircle size={18} />
                    {toast.message}
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
