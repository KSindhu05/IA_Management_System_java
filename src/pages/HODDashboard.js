import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
import {
    LayoutDashboard, Users, FileText, CheckCircle, TrendingUp, BarChart2,
    AlertTriangle, Briefcase, Bell, Activity, Clock, Award,
    Edit, Save, LogOut, ShieldAlert, X, BookOpen, Layers, Megaphone, Calendar, MapPin, PenTool, Download, Mail, Trash2, Key, UserPlus
} from 'lucide-react';
import {
    departments, subjectsByDept, getStudentsByDept, englishMarks, mathsMarks,
    departmentStats, facultySubjects, facultyProfiles
} from '../utils/mockData';
import styles from './HODDashboard.module.css';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import logo from '../assets/college_logo.png';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement, Filler
);

// Local fallbacks for removed mock data
const hodTrendData = { labels: ['2022', '2023', '2024'], datasets: [{ label: 'Pass %', data: [75, 80, 85], borderColor: '#3b82f6', fill: false }] };
// atRiskStudents is now a state, see useState below
const facultyWorkload = [];
const branchPerformanceData = {};
const iaSubmissionStatus = { labels: ['Submitted', 'Pending'], datasets: [{ data: [70, 30], backgroundColor: ['#22c55e', '#ef4444'] }] };
const resourceRequests = [];
const hodData = {};
const hodBranchComparison = {};

const parseSubjects = (subjects) => {
    if (!subjects) return [];
    if (Array.isArray(subjects)) return subjects;
    if (typeof subjects === 'string') {
        return subjects.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
};

const HODDashboard = ({ isSpectator = false, spectatorDept = null }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDept, setSelectedDept] = useState(user?.department || 'CSE');
    const [deptStudents, setDeptStudents] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isMyDept, setIsMyDept] = useState(true);

    // Filter State for "All Students"
    const [studentFilterSem, setStudentFilterSem] = useState('all');
    const [studentFilterSec, setStudentFilterSec] = useState('all');

    // Spectator Mode Effect
    useEffect(() => {
        if (isSpectator && spectatorDept) {
            setSelectedDept(spectatorDept);
            setIsMyDept(true); // Principal can view any dept
        }
    }, [isSpectator, spectatorDept]);

    const [editingMarks, setEditingMarks] = useState({});
    const [viewingSubject, setViewingSubject] = useState(null);

    // Student Profile State
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
    const [studentMarksProfile, setStudentMarksProfile] = useState([]);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // API State
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjectMarks, setSubjectMarks] = useState({});
    const [analytics, setAnalytics] = useState(null);
    const [subjectMarksData, setSubjectMarksData] = useState({});
    const [performanceSubjectId, setPerformanceSubjectId] = useState('all');
    const [cieTrendData, setCieTrendData] = useState([0, 0, 0, 0, 0]);
    const [allSubjectPerformance, setAllSubjectPerformance] = useState([]);

    // Syllabus Form State
    const [syllabusForm, setSyllabusForm] = useState({ subjectId: '', cieNumber: '1', syllabus: '' });
    const [syllabusLoading, setSyllabusLoading] = useState(false);

    // Announcement State
    const [departmentAnnouncements, setDepartmentAnnouncements] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
    const [showEditSelection, setShowEditSelection] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [facultyForm, setFacultyForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: 'password123',
        designation: 'Assistant Professor',
        semester: '',
        section: '',
        subjects: ''
    });

    // CIE Schedule Form State
    const [scheduleForm, setScheduleForm] = useState({
        cieNumber: 1,
    });
    const [editingScheduleId, setEditingScheduleId] = useState(null); // Track editing state

    // Pending Approvals State
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [approvalLoading, setApprovalLoading] = useState(false);
    const [expandedApprovals, setExpandedApprovals] = useState({});

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Student Management State
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [studentForm, setStudentForm] = useState({
        regNo: '', name: '', email: '', phone: '', parentPhone: '',
        semester: '1', section: 'A', password: 'password123'
    });

    // Reset Password State
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetTarget, setResetTarget] = useState(null); // { username, fullName, role }
    const [newPassword, setNewPassword] = useState('');

    // Overview data (real from API)
    const [departmentAlerts, setDepartmentAlerts] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [showAllAlerts, setShowAllAlerts] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [hodGradeDistribution, setHodGradeDistribution] = useState({
        labels: ['A', 'B', 'C', 'D', 'F'],
        datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'] }]
    });

    const toggleExpansion = (index) => {
        setExpandedApprovals(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };


    // Faculty Management State (Restored)
    const [viewingFaculty, setViewingFaculty] = useState(null);
    const [messagingFaculty, setMessagingFaculty] = useState(null);
    const [messageText, setMessageText] = useState('');

    const handleViewDashboard = (faculty) => {
        setViewingFaculty(faculty);
    };

    const handleMessage = (faculty) => {
        setMessagingFaculty(faculty);
        setMessageText('');
    };

    const sendMessage = async () => {
        if (!messageText.trim() || !messagingFaculty) return;

        try {
            const token = user?.token;
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const response = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: messagingFaculty.id,
                    message: messageText,
                    type: 'INFO', // Changed from MESSAGE to INFO to match backend ENUM
                    category: 'HOD'
                })
            });

            if (response.ok) {
                alert(`Message sent to ${messagingFaculty.fullName || messagingFaculty.username}`);
                setMessagingFaculty(null);
                setMessageText('');
            } else {
                const err = await response.text();
                alert('Failed to send message: ' + err);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message');
        }
    };

    const [messageRecipientType, setMessageRecipientType] = useState('FACULTY'); // FACULTY, STUDENT, PRINCIPAL
    const [newMessageText, setNewMessageText] = useState('');

    const handleSendNewMessage = async () => {
        if (!newMessageText.trim()) {
            alert('Please enter a message.');
            return;
        }

        try {
            const token = user?.token;
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const sendBroadcast = async (role) => {
                const payload = {
                    targetRole: role, // Backend expects 'targetRole' not 'recipientType'
                    message: newMessageText,
                    senderId: user?.id,
                    department: selectedDept
                };

                return fetch(`${API_BASE_URL}/notifications/broadcast`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            };

            let responses = [];
            if (messageRecipientType === 'BOTH') {
                // Send to both Faculty and Students
                const res1 = sendBroadcast('FACULTY');
                const res2 = sendBroadcast('STUDENT');
                responses = await Promise.all([res1, res2]);
            } else {
                // Send to specifically selected role
                const res = await sendBroadcast(messageRecipientType);
                responses = [res];
            }

            // Check if all requests were successful
            const allOk = responses.every(r => r.ok);

            if (allOk) {
                const groupName = messageRecipientType === 'BOTH' ? 'Students and Faculty' : `${messageRecipientType.toLowerCase()}s`;
                alert(`Message sent to all ${groupName}!`);
                setNewMessageText('');
            } else {
                console.error('Some messages failed');
                // Log details of failed requests
                responses.forEach(async (r, idx) => {
                    if (!r.ok) {
                        const err = await r.text();
                        console.error(`Request ${idx + 1} failed: ${r.status} ${r.statusText}`, err);
                    }
                });
                alert('Error sending message to some groups. Please check console for details.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message');
        }
    };

    const menuItems = [
        { label: 'Dashboard Overview', path: '#overview', icon: <LayoutDashboard size={20} />, isActive: activeTab === 'overview', onClick: () => setActiveTab('overview') },
        { label: 'CIE Schedule', path: '#cie-schedule', icon: <Calendar size={20} />, isActive: activeTab === 'cie-schedule', onClick: () => setActiveTab('cie-schedule') },
        { label: 'Syllabus', path: '#syllabus', icon: <BookOpen size={20} />, isActive: activeTab === 'syllabus', onClick: () => setActiveTab('syllabus') },
        { label: 'IA Monitoring', path: '#monitoring', icon: <Activity size={20} />, isActive: activeTab === 'monitoring', onClick: () => setActiveTab('monitoring') },
        { label: 'Student Performance', path: '#performance', icon: <TrendingUp size={20} />, isActive: activeTab === 'performance', onClick: () => setActiveTab('performance') },
        { label: 'Faculty Management', path: '#faculty', icon: <Briefcase size={20} />, isActive: activeTab === 'faculty', onClick: () => setActiveTab('faculty') },
        { label: 'All Students', path: '#all-students', icon: <Users size={20} />, isActive: activeTab === 'all-students', onClick: () => setActiveTab('all-students') },
        { label: 'Student Management', path: '#student-mgmt', icon: <UserPlus size={20} />, isActive: activeTab === 'student-mgmt', onClick: () => setActiveTab('student-mgmt') },
        { label: 'IA Approval Panel', path: '#approvals', icon: <CheckCircle size={20} />, isActive: activeTab === 'approvals', onClick: () => setActiveTab('approvals') },
        { label: 'Update Marks', path: '#marks', icon: <PenTool size={20} />, isActive: activeTab === 'update-marks', onClick: () => setActiveTab('update-marks') },
        { label: 'Notifications', path: '#notifications', icon: <Bell size={20} />, isActive: activeTab === 'notifications', onClick: () => setActiveTab('notifications') },
    ];


    const API_BASE = `${API_BASE_URL}/marks`;

    const handleAddFaculty = async (e) => {
        if (e) e.preventDefault();

        // Handle subjects specifically if they are comma separated
        const data = { ...facultyForm };

        let subjectsArray = [];
        if (Array.isArray(data.subjects)) {
            subjectsArray = data.subjects;
        } else if (typeof data.subjects === 'string') {
            subjectsArray = data.subjects.split(',').map(s => s.trim()).filter(s => s !== '');
        }

        // Convert to string for backend
        data.subjects = subjectsArray.join(', ');

        data.department = selectedDept;

        try {
            const token = user?.token;
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const method = editingFaculty ? 'PUT' : 'POST';
            const url = editingFaculty
                ? `${API_BASE_URL}/hod/faculty/${editingFaculty.id}`
                : `${API_BASE_URL}/hod/faculty`;

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert(editingFaculty ? 'Faculty updated successfully!' : 'Faculty added successfully!');
                setShowAddFacultyModal(false);
                setEditingFaculty(null);
                setFacultyForm({ fullName: '', username: '', email: '', password: 'password123', designation: 'Assistant Professor', semester: '', section: '', subjects: '' });
                fetchFaculty(); // Refresh the list
            } else {
                const errData = await response.json().catch(() => ({ message: 'Error processing faculty' }));
                const detailMsg = errData.details ? `\n- ${errData.details.join('\n- ')}` : '';
                alert(`Failed to process faculty: ${errData.message}${detailMsg}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error processing faculty');
        }
    };

    const handleEditFaculty = (fac) => {
        setEditingFaculty(fac);
        setFacultyForm({
            fullName: fac.fullName || '',
            username: fac.username || '',
            email: fac.email || '',
            password: '', // Password not pre-filled for editing
            designation: fac.designation || 'Assistant Professor',
            semester: fac.semester || '',
            section: fac.section || '',
            section: fac.section || '',
            subjects: fac.subjects ? (Array.isArray(fac.subjects) ? fac.subjects.join(', ') : fac.subjects) : ''
        });
        setShowAddFacultyModal(true);
    };

    const handleDeleteFaculty = async (facId) => {
        if (!window.confirm('Are you sure you want to remove this faculty member? This will permanently delete their account.')) return;

        try {
            const token = user?.token;
            const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const response = await fetch(`${API_BASE_URL}/hod/faculty/${facId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                alert('Faculty removed successfully');
                fetchFaculty(); // Refresh the list
            } else {
                const err = await response.json().catch(() => ({ message: 'Error removing faculty' }));
                const detailMsg = err.details ? `\nDetails: ${err.details}` : '';
                const tableMsg = err.table ? `\nTable: ${err.table}` : '';
                alert(`Failed to remove faculty: ${err.message}${detailMsg}${tableMsg}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error removing faculty');
        }
    };

    const fetchFaculty = async () => {
        if (!isMyDept || !selectedDept || !user?.token) return;
        try {
            const headers = { 'Authorization': `Bearer ${user.token}` };
            const response = await fetch(`${API_BASE_URL}/hod/faculty?department=${selectedDept}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setFacultyList(data);
            }
        } catch (e) {
            console.error("Failed to fetch faculty list", e);
        }
    };

    // Fetch faculty list on mount (needed for overview stat card)
    useEffect(() => {
        fetchFaculty();
    }, [isMyDept, selectedDept, user]);

    // Fetch overview data (real alerts, grade distribution)
    useEffect(() => {
        if (isMyDept && selectedDept && user?.token) {
            const fetchOverview = async () => {
                try {
                    const headers = { 'Authorization': `Bearer ${user.token}` };
                    const response = await fetch(`${API_BASE_URL}/hod/overview?department=${selectedDept}`, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.alerts) setDepartmentAlerts(data.alerts);
                        if (data.atRiskStudents) setAtRiskStudents(data.atRiskStudents);
                        if (data.gradeDistribution) {
                            setHodGradeDistribution({
                                labels: data.gradeDistribution.labels,
                                datasets: [{
                                    data: data.gradeDistribution.data,
                                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']
                                }]
                            });
                        }
                        // Populate analytics from overview data
                        setAnalytics({
                            average: data.deptAverage || 0,
                            passPercentage: data.passPercentage || 0,
                            atRiskCount: data.atRiskCount || 0,
                            totalStudents: data.totalStudents || 0
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch overview data", e);
                }
            };
            fetchOverview();
        }
    }, [isMyDept, selectedDept, user]);

    // Fetch Subject Marks Data for IA Monitoring
    useEffect(() => {
        if ((activeTab === 'monitoring' || activeTab === 'faculty') && isMyDept && subjects.length > 0 && deptStudents.length > 0) {
            const fetchSubjectMarks = async () => {
                try {
                    const token = user?.token;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const marksDataBySubject = {};

                    for (const subject of subjects) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/marks/subject/${subject.id}`, { headers });
                            if (response.ok) {
                                const marksData = await response.json();
                                marksDataBySubject[subject.name] = marksData;
                            }
                        } catch (e) {
                            console.error(`Failed to fetch marks for ${subject.name}`, e);
                        }
                    }
                    setSubjectMarksData(marksDataBySubject);
                } catch (e) {
                    console.error("Failed to fetch subject marks", e);
                }
            };
            fetchSubjectMarks();
        }
    }, [activeTab, isMyDept, subjects, deptStudents]);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = user?.token;
                if (!token) return;
                const headers = { 'Authorization': `Bearer ${token}` };
                const response = await fetch(`${API_BASE_URL}/cie/hod/notifications`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.isRead).length);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };
        fetchNotifications();
        fetchNotifications();
    }, [user]);

    const handleClearNotifications = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;
        try {
            const token = user?.token;
            if (!token) return;
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/notifications/clear`, { method: 'DELETE', headers });
            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
                alert('Notifications cleared successfully');
            } else {
                alert('Failed to clear notifications');
            }
        } catch (e) {
            console.error("Failed to clear notifications", e);
            alert('Error clearing notifications');
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            const token = user?.token;
            if (!token) return;
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE', headers });
            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                // Recalculate unread count if needed
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (e) {
            console.error("Failed to delete notification", e);
        }
    };

    // Fetch pending approvals when tab is active
    useEffect(() => {
        if (activeTab === 'approvals' && isMyDept) {
            const fetchPendingApprovals = async () => {
                setApprovalLoading(true);
                try {
                    const token = user?.token;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${API_BASE_URL}/marks/pending?department=${selectedDept}`, { headers });
                    if (response.ok) {
                        const rawMarks = await response.json();
                        // Group raw CieMark records by subject + cieType
                        const grouped = {};
                        rawMarks.forEach(mark => {
                            const subjectName = mark.subject?.name || 'Unknown Subject';
                            const cieType = mark.cieType || 'CIE1';
                            const key = `${mark.subject?.id || 0}_${cieType}`;
                            if (!grouped[key]) {
                                grouped[key] = {
                                    subjectId: mark.subject?.id,
                                    subjectName: subjectName,
                                    iaType: cieType,
                                    facultyName: mark.subject?.instructorName || 'Unknown',
                                    studentCount: 0,
                                    marks: []
                                };
                            }
                            grouped[key].marks.push({
                                studentId: mark.student?.id,
                                regNo: mark.student?.regNo || '-',
                                studentName: mark.student?.name || '-',
                                totalScore: mark.marks || 0
                            });
                            grouped[key].studentCount = grouped[key].marks.length;
                        });
                        setPendingApprovals(Object.values(grouped));
                    }
                } catch (e) {
                    console.error("Failed to fetch pending approvals", e);
                } finally {
                    setApprovalLoading(false);
                }
            };
            fetchPendingApprovals();
        }
    }, [activeTab, isMyDept, selectedDept]);

    // Fetch Subject Trend Data for Performance Tab
    // Unified Performance data fetching
    useEffect(() => {
        const fetchPerformanceData = async () => {
            try {
                const token = user?.token;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                // Combined fetch from the stable overview endpoint
                const response = await fetch(`${API_BASE_URL}/hod/overview?department=${selectedDept}`, { headers });

                if (response.ok) {
                    const data = await response.json();

                    // 1. Update Trend Data (Dept or Subject)
                    if (performanceSubjectId === 'all') {
                        setCieTrendData([
                            data.cieTrend?.CIE1 || 0,
                            data.cieTrend?.CIE2 || 0,
                            data.cieTrend?.CIE3 || 0,
                            data.cieTrend?.CIE4 || 0,
                            data.cieTrend?.CIE5 || 0
                        ]);
                    } else {
                        // For a specific subject, find it in the list
                        const sub = data.subjectPerfList?.find(s => String(s.id) === String(performanceSubjectId));
                        if (sub) {
                            setCieTrendData([
                                sub.averages.CIE1 || 0,
                                sub.averages.CIE2 || 0,
                                sub.averages.CIE3 || 0,
                                sub.averages.CIE4 || 0,
                                sub.averages.CIE5 || 0
                            ]);
                        }
                    }

                    // 2. Update subject performance list
                    if (data.subjectPerfList) {
                        setAllSubjectPerformance(data.subjectPerfList);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch performance data", e);
            }
        };

        if (activeTab === 'performance' && isMyDept && selectedDept) {
            fetchPerformanceData();
        }
    }, [activeTab, performanceSubjectId, isMyDept, selectedDept, user]);

    useEffect(() => {
        const userDept = user?.department || 'CSE'; // Get from user profile
        const isAuthorized = selectedDept === userDept; // For now assuming admin/HOD access
        setIsMyDept(true); // Allow viewing specific departments

        const fetchStudents = async () => {
            try {
                const token = user?.token;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${API_BASE_URL}/student/all?department=${selectedDept}`, { headers });
                if (response.ok) {
                    const data = await response.json();

                    // --- GLOBAL SYNC: Check for updates ---
                    const globalUpdates = JSON.parse(localStorage.getItem('global_student_updates') || '{}');
                    const updatedData = data.map(s => {
                        const updates = globalUpdates[s.id];
                        return updates ? { ...s, ...updates } : s;
                    });

                    setDeptStudents(updatedData);
                    setStudents(updatedData);
                } else {
                    setDeptStudents([]);
                    setStudents([]);
                }
            } catch (e) {
                console.error("Failed to fetch students", e);
            }
        };

        if (selectedDept) {
            fetchStudents();
        } else {
            setDeptStudents([]); setStudents([]); setSubjects([]); setSelectedSubject(null);
        }
    }, [selectedDept, user]);




    useEffect(() => {
        if (selectedSubject && selectedSubject.id) {
            const fetchMarks = async () => {
                try {
                    const token = user?.token;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${API_BASE_URL}/marks/subject/${selectedSubject.id}`, { headers });

                    if (response.ok) {
                        const marksData = await response.json();
                        console.log('Fetched Marks for Subject ' + selectedSubject.id, marksData);
                        const marksMap = {};

                        // Populate editingMarks from DB data
                        marksData.forEach(m => {
                            if (!marksMap[m.studentId]) marksMap[m.studentId] = {};
                            // Treat 0 marks on PENDING status as null (not yet entered)
                            const markValue = (m.marks === 0 || m.marks === null) && m.status === 'PENDING' ? null : m.marks;
                            if (m.cieType === 'CIE1') marksMap[m.studentId].cie1 = markValue;
                            if (m.cieType === 'CIE2') marksMap[m.studentId].cie2 = markValue;
                            if (m.cieType === 'CIE3') marksMap[m.studentId].cie3 = markValue;
                            if (m.cieType === 'CIE4') marksMap[m.studentId].cie4 = markValue;
                            if (m.cieType === 'CIE5') marksMap[m.studentId].cie5 = markValue;
                        });
                        setEditingMarks(marksMap);
                    }
                } catch (e) {
                    console.error("Failed to fetch marks for editing", e);
                }
            };
            fetchMarks();
        }
    }, [selectedSubject]);

    useEffect(() => {
        if (isMyDept && selectedDept) {
            const fetchAnnouncements = async () => {
                try {
                    const token = user?.token;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(`${API_BASE_URL}/cie/hod/announcements`, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        // Deduplicate by id to prevent duplicate schedule entries
                        const unique = data.filter((item, index, self) =>
                            index === self.findIndex(t => t.id === item.id)
                        );
                        setDepartmentAnnouncements(unique);
                    }
                    else {
                        setDepartmentAnnouncements([{ id: 1, cieNumber: '1', scheduledDate: '2025-03-10', subject: { name: 'Python', code: '20CS31' }, faculty: { username: 'Wahida Banu' }, status: 'SCHEDULED' }]);
                    }
                } catch (e) { console.error("Failed to fetch announcements", e); }
            };
            fetchAnnouncements();
        }
    }, [isMyDept, selectedDept]);

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.cieNumber = scheduleForm.cieNumber;
        data.senderId = user?.username; // Add senderId for robust auth handling


        try {
            const token = user?.token;
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const baseUrl = API_BASE.replace('/marks', '/hod');

            let response;
            if (editingScheduleId) {
                // UPDATE Existing Schedule
                response = await fetch(`${API_BASE_URL}/cie/announcements/${editingScheduleId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(data)
                });
            } else {
                // CREATE New Schedule
                response = await fetch(`${API_BASE_URL}/cie/announcements?subjectId=${data.subjectId}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                alert(editingScheduleId ? 'CIE Schedule Updated Successfully!' : 'CIE Schedule Published Successfully!');
                setActiveTab('cie-schedule');
                setEditingScheduleId(null); // Reset edit mode
                window.location.reload();
            } else { alert('Failed to publish schedule'); }
        } catch (error) { console.error(error); alert('Error publishing schedule'); }
    };

    const handleEditSchedule = (schedule) => {
        setEditingScheduleId(schedule.id);
        setScheduleForm(prev => ({ ...prev, cieNumber: schedule.cieNumber }));

        // Populate form fields (Need to access DOM or controlled inputs ideally, but simpler here for now)
        // Since the form uses uncontrolled inputs with name attributes, we can try to key the form or use state.
        // For now, let's just use state for the controlled parts and warn user they might need to re-enter if not fully controlled.
        // BETTER APPROACH: Switch to fully controlled form or Key the form. 
        // Let's use document.getElementsByName since it is quick for this refactor without rewriting entire form to controlled components.
        setTimeout(() => {
            const subjectSelect = document.querySelector('select[name="subjectId"]');
            const dateInput = document.querySelector('input[name="scheduledDate"]');
            const timeInput = document.querySelector('input[name="startTime"]');
            const durationInput = document.querySelector('input[name="durationMinutes"]');
            const roomInput = document.querySelector('input[name="examRoom"]');
            const instructionsInput = document.querySelector('textarea[name="integrationInstructions"]');

            if (subjectSelect) subjectSelect.value = schedule.subject?.id || '';
            if (dateInput) dateInput.value = schedule.scheduledDate || '';
            if (timeInput) timeInput.value = schedule.startTime || '';
            if (durationInput) durationInput.value = schedule.durationMinutes || 60;
            if (roomInput) roomInput.value = schedule.examRoom || '';
            if (instructionsInput) instructionsInput.value = schedule.instructions || '';
        }, 100);

        // Scroll to form
        document.querySelector('#scheduleFormSection')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('Are you sure you want to delete this schedule? This cannot be undone.')) return;
        try {
            const token = user?.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${API_BASE_URL}/cie/announcements/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                alert('Schedule deleted successfully');
                setDepartmentAnnouncements(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Failed to delete schedule');
            }
        } catch (e) {
            console.error("Failed to delete schedule", e);
            alert('Error deleting schedule');
        }
    };

    const cancelEdit = () => {
        setEditingScheduleId(null);
        document.querySelector('form').reset();
    };

    useEffect(() => {
        if (isMyDept) {
            const fetchSubjects = async () => {
                try {
                    const token = user?.token;
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    // Removed unused localhost URL
                    const response = await fetch(`${API_BASE_URL}/subjects/department/${selectedDept}`, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        setSubjects(data);
                        // Auto-select first subject for update-marks tab
                        if (activeTab === 'update-marks' && data.length > 0 && !selectedSubject) {
                            setSelectedSubject(data[0]);
                        }
                    }
                } catch (e) { console.error("Failed to fetch subjects", e); }
            };
            fetchSubjects();
        }
    }, [activeTab, isMyDept, selectedDept]);

    const commonOptions = { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }, maintainAspectRatio: false };
    const doughnutOptions = { responsive: true, plugins: { legend: { position: 'right' } }, maintainAspectRatio: false };

    const handleLogout = () => { window.location.href = '/'; };

    const handleMarkChange = (studentId, field, value) => {
        if (value === '') {
            setEditingMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: '' } }));
            return;
        }
        let numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;
        const max = 50; // Each CIE has max 50 marks
        if (numValue < 0) numValue = 0; if (numValue > max) numValue = max;
        setEditingMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: numValue } }));
    };

    const saveMarks = async () => {
        if (!selectedSubject) return;

        const payload = [];
        Object.keys(editingMarks).forEach(studentId => {
            const marks = editingMarks[studentId];
            const sid = Number(studentId);
            if (marks.cie1 !== undefined && marks.cie1 !== null) payload.push({ studentId: sid, subjectId: selectedSubject.id, iaType: 'CIE1', co1: Number(marks.cie1) });
            if (marks.cie2 !== undefined && marks.cie2 !== null) payload.push({ studentId: sid, subjectId: selectedSubject.id, iaType: 'CIE2', co1: Number(marks.cie2) });
            if (marks.cie3 !== undefined && marks.cie3 !== null) payload.push({ studentId: sid, subjectId: selectedSubject.id, iaType: 'CIE3', co1: Number(marks.cie3) });
            if (marks.cie4 !== undefined && marks.cie4 !== null) payload.push({ studentId: sid, subjectId: selectedSubject.id, iaType: 'CIE4', co1: Number(marks.cie4) });
            if (marks.cie5 !== undefined && marks.cie5 !== null) payload.push({ studentId: sid, subjectId: selectedSubject.id, iaType: 'CIE5', co1: Number(marks.cie5) });
        });

        if (payload.length === 0) {
            alert("No changes to save.");
            return;
        }

        try {
            const token = user?.token;
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const response = await fetch(`${API_BASE_URL}/marks/update/batch`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Marks updated successfully!');
            } else {
                const err = await response.text();
                alert('Failed to update marks: ' + err);
            }
        } catch (e) {
            console.error(e);
            alert('Error updating marks');
        }
    };

    const handleApproveMarks = async (subjectId, iaType) => {
        if (!window.confirm(`Are you sure you want to APPROVE marks for ${iaType}? This will lock these marks.`)) return;
        try {
            const token = user?.token;
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/marks/approve?subjectId=${subjectId}&iaType=${iaType}`, {
                method: 'POST',
                headers
            });
            if (response.ok) {
                alert('Marks approved successfully!');
                setPendingApprovals(prev => prev.filter(p => !(p.subjectId === subjectId && p.iaType === iaType)));
            } else {
                const err = await response.text();
                alert('Failed to approve: ' + err);
            }
        } catch (e) {
            console.error(e);
            alert('Error approving marks');
        }
    };

    const handleRejectMarks = async (subjectId, iaType) => {
        if (!window.confirm(`Are you sure you want to REJECT marks for ${iaType}? Faculty will need to resubmit.`)) return;
        try {
            const token = user?.token;
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/marks/reject?subjectId=${subjectId}&iaType=${iaType}`, {
                method: 'POST',
                headers
            });
            if (response.ok) {
                alert('Marks rejected. Faculty has been notified.');
                setPendingApprovals(prev => prev.filter(p => !(p.subjectId === subjectId && p.iaType === iaType)));
            } else {
                const err = await response.text();
                alert('Failed to reject: ' + err);
            }
        } catch (e) {
            console.error(e);
            alert('Error rejecting marks');
        }
    };

    const handleUnlockMarks = async (subjectId, iaType, subjectName) => {
        const reason = prompt(`Why are you unlocking ${subjectName} ${iaType} marks?\n(Optional - press OK to skip)`);

        if (reason === null) return; // User clicked Cancel

        if (!window.confirm(`Are you sure you want to UNLOCK ${subjectName} ${iaType} marks?\n\nThis will change the status from APPROVED to PENDING, allowing faculty to edit them again.`)) {
            return;
        }

        try {
            const token = user?.token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`${API_BASE_URL}/marks/unlock`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    subjectId,
                    iaType,
                    reason: reason || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Success: ${result.message || 'Marks unlocked successfully!'}\n\nFaculty can now edit these marks.`);
                // Reload page to show updated status
                window.location.reload();
            } else {
                const err = await response.json();
                console.error('Unlock failed response:', err);
                alert(`Failed to unlock: ${err.message || 'Unknown error'} (Status: ${response.status})`);
            }
        } catch (e) {
            console.error('Unlock error:', e);
            alert(`Error unlocking marks: ${e.message}. Check console for details.`);
        }
    };


    const AccessDeniedView = () => (
        <div className={styles.accessDeniedContainer}>
            <div className={styles.deniedContent}>
                <ShieldAlert size={64} className={styles.deniedIcon} />
                <h2>Restricted Access</h2>
                <p>You are not authorized to view or modify data for the <strong>{departments.find(d => d.id === selectedDept)?.name}</strong> department.</p>
                <div className={styles.warningNote}>
                    <AlertTriangle size={16} />
                    <span>This action has been logged. Please switch back to your assigned department (Computer Science).</span>
                </div>
                <button className={styles.backBtn} onClick={() => setSelectedDept(user?.department || 'CSE')}>Return to My Department</button>
            </div>
        </div>
    );

    const fetchStudentProfile = async (student) => {
        try {
            setSelectedStudentProfile(student);
            setStudentMarksProfile([]);
            setShowProfileModal(true);

            const token = user?.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${API_BASE_URL}/marks/student/${student.id}`, { headers });

            if (response.ok) {
                const data = await response.json();
                setStudentMarksProfile(data);
            }
        } catch (e) {
            console.error("Failed to fetch student profile marks", e);
        }
    };

    // ========== STUDENT MANAGEMENT HANDLERS ==========
    const handleAddStudent = async (e) => {
        if (e) e.preventDefault();
        const data = { ...studentForm, department: selectedDept };

        try {
            const token = user?.token;
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const response = await fetch(`${API_BASE_URL}/hod/students`, {
                method: 'POST', headers, body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Student created successfully! They can now login with their Reg No.');
                setShowAddStudentModal(false);
                setStudentForm({ regNo: '', name: '', email: '', phone: '', parentPhone: '', semester: '1', section: 'A', password: 'password123' });
                // Refresh student list
                window.location.reload();
            } else {
                const err = await response.json().catch(() => ({ message: 'Error creating student' }));
                alert(`Failed: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error creating student');
        }
    };

    const handleDeleteStudent = async (regNo) => {
        if (!window.confirm(`Are you sure you want to delete student ${regNo}? This will remove their login account and all data.`)) return;
        try {
            const token = user?.token;
            const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const response = await fetch(`${API_BASE_URL}/hod/students/${regNo}`, { method: 'DELETE', headers });
            if (response.ok) {
                alert('Student deleted successfully');
                window.location.reload();
            } else {
                alert('Failed to delete student');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting student');
        }
    };

    const openResetPasswordModal = (username, fullName, role) => {
        setResetTarget({ username, fullName, role });
        setNewPassword('');
        setShowResetPasswordModal(true);
    };

    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword || newPassword.length < 4) {
            alert('Please enter a password with at least 4 characters.');
            return;
        }
        try {
            const token = user?.token;
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const response = await fetch(`${API_BASE_URL}/hod/credentials/reset`, {
                method: 'PUT', headers,
                body: JSON.stringify({ username: resetTarget.username, newPassword })
            });
            if (response.ok) {
                alert(`Password reset successfully for ${resetTarget.fullName || resetTarget.username}`);
                setShowResetPasswordModal(false);
            } else {
                const err = await response.json().catch(() => ({ message: 'Error resetting password' }));
                alert(`Failed: ${err.message}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error resetting password');
        }
    };

    const renderStudentManagement = () => {
        const filteredStudents = deptStudents.filter(std => {
            const semMatch = studentFilterSem === 'all' || std.semester == studentFilterSem;
            const secMatch = studentFilterSec === 'all' || (std.section && std.section.toUpperCase() === studentFilterSec);
            return semMatch && secMatch;
        });

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className={styles.sectionTitle} style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Student Management ({filteredStudents.length})</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select className={styles.deptSelect} value={studentFilterSem} onChange={(e) => setStudentFilterSem(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="all">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6].map(sem => (
                                <option key={sem} value={sem}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</option>
                            ))}
                        </select>
                        <button className={styles.primaryBtn} onClick={() => setShowAddStudentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserPlus size={16} /> Add New Student
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Sl. No</th>
                                <th>Reg No</th>
                                <th>Student Name</th>
                                <th>Sem / Sec</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map((std, index) => (
                                <tr key={std.id}>
                                    <td style={{ color: '#64748b' }}>{index + 1}</td>
                                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{std.regNo}</td>
                                    <td>{std.name}</td>
                                    <td>{std.semester} - {std.section || 'A'}</td>
                                    <td>{std.email || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className={styles.secondaryBtn} onClick={() => openResetPasswordModal(std.regNo, std.name, 'STUDENT')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }} title="Reset Password">
                                                <Key size={14} /> Reset
                                            </button>
                                            <button className={styles.secondaryBtn} onClick={() => handleDeleteStudent(std.regNo)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} title="Delete Student">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Student Modal */}
                {showAddStudentModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
                            <div className={styles.modalHeader}>
                                <h3>Add New Student</h3>
                                <button className={styles.closeBtn} onClick={() => setShowAddStudentModal(false)}><X size={24} /></button>
                            </div>
                            <div className={styles.modalBody}>
                                <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className={styles.formGroup}>
                                        <label>Register Number (used for login)</label>
                                        <input value={studentForm.regNo} onChange={e => setStudentForm({ ...studentForm, regNo: e.target.value })} required placeholder="e.g. 4JK22CS001" className={styles.input} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Full Name</label>
                                        <input value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required placeholder="e.g. John Doe" className={styles.input} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email</label>
                                        <input value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} type="email" placeholder="john@college.edu" className={styles.input} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Semester</label>
                                            <select value={studentForm.semester} onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })} className={styles.input}>
                                                {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Sem</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Section</label>
                                            <input value={studentForm.section} onChange={e => setStudentForm({ ...studentForm, section: e.target.value })} placeholder="A" className={styles.input} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Phone</label>
                                            <input value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} placeholder="9876543210" className={styles.input} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Parent Phone</label>
                                            <input value={studentForm.parentPhone} onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })} placeholder="9876543211" className={styles.input} />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Temporary Password</label>
                                        <input value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} required placeholder="password123" className={styles.input} />
                                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Student can change this after first login.</small>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button type="button" className={styles.secondaryBtn} onClick={() => setShowAddStudentModal(false)}>Cancel</button>
                                        <button type="submit" className={styles.primaryBtn} style={{ background: '#2563eb', color: 'white' }}>Create Student</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderResetPasswordModal = () => {
        if (!showResetPasswordModal || !resetTarget) return null;
        return (
            <div className={styles.modalOverlay} onClick={() => setShowResetPasswordModal(false)}>
                <div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={20} /> Reset Password</h3>
                        <button className={styles.closeBtn} onClick={() => setShowResetPasswordModal(false)}><X size={24} /></button>
                    </div>
                    <div className={styles.modalBody}>
                        <p style={{ marginBottom: '1rem', color: '#475569' }}>
                            Resetting password for <strong>{resetTarget.fullName || resetTarget.username}</strong>
                            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: '#64748b' }}>{resetTarget.role}</span>
                        </p>
                        <div className={styles.formGroup}>
                            <label>New Password</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 4 chars)"
                                className={styles.input}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className={styles.secondaryBtn} onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
                            <button className={styles.primaryBtn} onClick={handleResetPassword} disabled={newPassword.length < 4} style={{ opacity: newPassword.length < 4 ? 0.6 : 1, background: '#d97706', color: 'white' }}>
                                <Key size={14} /> Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAllStudents = () => {
        // Calculate available sections based on Students AND Faculty
        const studentSections = deptStudents.map(s => s.section || 'A');
        const facultySections = facultyList.map(f => f.section).filter(Boolean); // Filter out null/undefined

        // Combine and unique
        const allSections = [...new Set([...studentSections, ...facultySections])].map(s => s.toUpperCase());
        let uniqueSections = allSections.sort();

        // Ensure 'A' is always present if list is empty (default behavior)
        if (uniqueSections.length === 0) uniqueSections = ['A'];

        // Filter Logic
        const filteredStudents = deptStudents.filter(std => {
            const semMatch = studentFilterSem === 'all' || std.semester == studentFilterSem;
            const secMatch = studentFilterSec === 'all' || (std.section && std.section.toUpperCase() === studentFilterSec);
            return semMatch && secMatch;
        });

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className={styles.sectionTitle} style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>All Students ({filteredStudents.length})</h2>

                    <div className={styles.filterGroup} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            className={styles.deptSelect}
                            value={studentFilterSem}
                            onChange={(e) => setStudentFilterSem(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="all">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6].map(sem => (
                                <option key={sem} value={sem}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</option>
                            ))}
                        </select>
                        <select
                            className={styles.deptSelect}
                            value={studentFilterSec}
                            onChange={(e) => setStudentFilterSec(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="all">All Sections</option>
                            {uniqueSections.map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                            ))}
                        </select>
                        <button className={styles.primaryBtn} onClick={() => alert("Export Feature Coming Soon")}>
                            <Download size={18} /> Export List
                        </button>
                    </div>
                </div>
                <div className={styles.tableContainer} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Sl. No</th>
                                <th>Reg No</th>
                                <th>Student Name</th>
                                <th>Sem / Sec</th>
                                <th>Parent Phone</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map((std, index) => (
                                <tr key={std.id}>
                                    <td style={{ color: '#64748b' }}>{index + 1}</td>
                                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{std.regNo}</td>
                                    <td>{std.name}</td>
                                    <td>{std.semester} - {std.section || 'A'}</td>
                                    <td>{std.parentPhone || '-'}</td>
                                    <td>
                                        <button
                                            className={styles.secondaryBtn}
                                            onClick={() => fetchStudentProfile(std)}
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Users size={14} /> View Profile
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        No students found for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderStudentProfileModal = () => {
        if (!showProfileModal || !selectedStudentProfile) return null;

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent} style={{ maxWidth: '800px', width: '90%' }}>
                    <div className={styles.modalHeader}>
                        <div>
                            <h3 className={styles.modalTitle}>{selectedStudentProfile.name}</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                {selectedStudentProfile.regNo} | {selectedStudentProfile.semester} Sem | Section {selectedStudentProfile.section || 'A'}
                            </p>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                Parent Contact: <strong>{selectedStudentProfile.parentPhone || 'Not Available'}</strong>
                            </p>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setShowProfileModal(false)}>
                            <X size={24} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <h4 style={{ marginBottom: '1rem', color: '#334155' }}>CIE Marks Overview</h4>
                        {studentMarksProfile.length > 0 ? (
                            <table className={styles.table} style={{ border: '1px solid #e2e8f0' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th>Subject</th>
                                        <th>CIE Type</th>
                                        <th>Marks Obtained</th>
                                        <th>Max Marks</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {studentMarksProfile.map((mark, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{mark.subjectName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{mark.subjectCode}</div>
                                            </td>
                                            <td><span className={styles.statusBadge} style={{ background: '#e0f2fe', color: '#0369a1' }}>{mark.cieType}</span></td>
                                            <td style={{ fontWeight: 600 }}>{mark.marks}</td>
                                            <td style={{ color: '#64748b' }}>{mark.maxMarks}</td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                                No marks found for this student.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };


    // Extracted tab-rendering content into a reusable function
    const renderContent = () => (
        <>
            {activeTab === 'announcements' && (<div className={styles.announcementContainer}><div className={styles.card}><div className={styles.cardHeader}><h3>Department IA Schedule</h3><div style={{ display: 'flex', gap: '10px' }}><button className={styles.secondaryBtn}><Calendar size={16} /> Sync to Calendar</button><button className={styles.quickBtn} style={{ background: '#fef3c7', color: '#d97706' }}><ShieldAlert size={16} /> Check Conflicts</button></div></div><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Subject</th><th>CIE Round</th><th>Faculty</th><th>Scheduled Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{departmentAnnouncements.length > 0 ? departmentAnnouncements.map((ann, idx) => (<tr key={idx}><td style={{ fontWeight: 600 }}>{ann.subject?.name}</td><td><span className={styles.tag}>CIE-{ann.cieNumber}</span></td><td>{ann.faculty?.username}</td><td>{ann.scheduledDate}</td><td><span className={`${styles.statusBadge} ${styles.approved}`}>{ann.status || 'SCHEDULED'}</span></td><td>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={styles.iconBtn} onClick={() => handleEditSchedule(ann)} title="Edit" style={{ color: '#2563eb', background: '#dbeafe' }}><Edit size={16} /></button>
                    <button className={styles.iconBtn} onClick={() => handleDeleteSchedule(ann.id)} title="Delete" style={{ color: '#dc2626', background: '#fee2e2' }}><Trash2 size={16} /></button>
                </div>
            </td></tr>)) : (<tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No announcements found.</td></tr>)}</tbody></table></div></div></div>)}
            {activeTab === 'notifications' && (
                <div className={styles.notificationsContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Send Message</h2>
                        <div className={styles.messageForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Recipient Group</label>
                                <select
                                    className={styles.deptSelect}
                                    value={messageRecipientType}
                                    onChange={(e) => setMessageRecipientType(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem' }}
                                >
                                    <option value="FACULTY">All Faculty</option>
                                    <option value="STUDENT">All Students</option>
                                    <option value="BOTH">Students and Faculty</option>
                                    <option value="PRINCIPAL">Principal</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Message</label>
                                <textarea
                                    className={styles.input}
                                    rows="5"
                                    placeholder="Type your message here..."
                                    value={newMessageText || ''}
                                    onChange={(e) => {
                                        console.log('Typing:', e.target.value);
                                        setNewMessageText(e.target.value);
                                    }}
                                    disabled={false}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        color: '#333333',
                                        position: 'relative',
                                        zIndex: 10
                                    }}
                                />
                            </div>
                            <button className={styles.primaryBtn} onClick={handleSendNewMessage} style={{ alignSelf: 'flex-start' }}>
                                <Mail size={16} /> Send Message
                            </button>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className={styles.cardTitle} style={{ margin: 0 }}>All Notifications</h2>
                            {notifications.length > 0 && (
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={handleClearNotifications}
                                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2', display: 'flex', alignItems: 'center' }}
                                >
                                    <Trash2 size={14} style={{ marginRight: '4px' }} /> Clear All
                                </button>
                            )}
                        </div>
                        <div className={styles.notificationsList}>
                            {notifications.length > 0 ? notifications.map(notif => (
                                <div key={notif.id} className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ''}`} style={{ position: 'relative' }}>
                                    <div className={styles.notifIcon}>{notif.type === 'INFO' ? <Bell size={20} /> : <AlertTriangle size={20} />}</div>
                                    <div className={styles.notifContent} style={{ paddingRight: '20px' }}>
                                        <p className={styles.notifMessage}>{notif.message}</p>
                                        <span className={styles.notifTime}>{new Date(notif.createdAt).toLocaleString()}</span>
                                        {notif.category && <span className={styles.notifCategory}>{notif.category}</span>}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id); }}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                        className={styles.deleteNotifBtn}
                                        title="Delete"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )) : (
                                <div className={styles.emptyState}><Bell size={48} /><p>No notifications yet</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'all-students' && renderAllStudents()}
            {activeTab === 'student-mgmt' && renderStudentManagement()}
            {activeTab === 'overview' && (<div className={styles.overviewContainer}><div className={styles.statsRow}><div className={styles.statCard} onClick={() => setActiveTab('all-students')} style={{ cursor: 'pointer' }}><div className={`${styles.iconBox} ${styles.blue}`}><Users size={24} /></div><div className={styles.statInfo}><p>Total Students</p><h3>{deptStudents.length || 0}</h3></div></div><div className={styles.statCard} onClick={() => setActiveTab('faculty')} style={{ cursor: 'pointer' }}><div className={`${styles.iconBox} ${styles.green}`}><Briefcase size={24} /></div><div className={styles.statInfo}><p>Faculty Members</p><h3>{facultyList.length || 0}</h3></div></div><div className={styles.statCard} onClick={() => setActiveTab('performance')} style={{ cursor: 'pointer' }}><div className={`${styles.iconBox} ${styles.purple}`}><FileText size={24} /></div><div className={styles.statInfo}><p>Dept. Average</p><h3>{analytics ? analytics.average : '-'}/50</h3></div></div><div className={styles.statCard} onClick={() => setActiveTab('performance')} style={{ cursor: 'pointer' }}><div className={`${styles.iconBox} ${styles.orange}`}><Activity size={24} /></div><div className={styles.statInfo}><p>Pass Percentage</p><h3>{analytics ? analytics.passPercentage : '-'}%</h3></div></div></div><div className={styles.gridTwoOne}><div className={styles.leftColumn}><div className={styles.card} style={{ marginBottom: '1.5rem' }}><div className={styles.cardHeader}><h3>Department Performance (Avg IA Score)</h3></div><div className={styles.circlesContainer}><div className={styles.circlesContainer}>{analytics ? [{ label: 'Avg Percentage', value: Math.round(((analytics.average || 0) / 50) * 100) }, { label: 'Pass Rate', value: analytics.passPercentage || 0 }, { label: 'Risk Factor', value: (analytics.totalStudents || deptStudents.length) > 0 ? Math.round(((analytics.atRiskCount || 0) / (analytics.totalStudents || deptStudents.length)) * 100) : 0 }].map((metric, index) => { const data = { labels: ['Metric', 'Remaining'], datasets: [{ data: [metric.value, 100 - metric.value], backgroundColor: ['#8b5cf6', '#f3f4f6'], borderWidth: 0, cutout: '70%' }] }; return (<div key={index} className={styles.circleItem}><div style={{ height: '120px', width: '120px', position: 'relative' }}><Doughnut data={data} options={{ ...doughnutOptions, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} /><div className={styles.circleLabel}><span className={styles.circleValue}>{metric.value}%</span></div></div><p className={styles.circleName}>{metric.label}</p></div>); }) : <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading Analytics...</p>}</div></div></div></div><div className={styles.rightColumn}><div className={styles.card}><div className={styles.cardHeader}><h3>Recent Alerts</h3>{departmentAlerts.length > 3 && (<button className={styles.secondaryBtn} style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => setShowAllAlerts(!showAllAlerts)}>{showAllAlerts ? 'Show Less' : 'View All'}</button>)}</div><div className={styles.alertList}>{(showAllAlerts ? departmentAlerts : departmentAlerts.slice(0, 3)).map(alert => (<div key={alert.id} className={`${styles.alertItem} ${styles[alert.type]}`}><AlertTriangle size={16} /><div><p>{alert.message}</p><span>{alert.date}</span></div></div>))}</div></div></div></div></div>)}
            {activeTab === 'update-marks' && (<div className={styles.updateMarksContainer}><div className={styles.card}><div className={styles.cardHeader}><h3>Modify Student Marks</h3><div className={styles.filterGroup}>
                <select className={styles.deptSelect} value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ marginRight: '10px' }}>
                    <option value="all">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6].map(sem => (
                        <option key={sem} value={sem}>{sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester</option>
                    ))}
                </select>
                <select className={styles.deptSelect} value={selectedSubject?.id || ''} onChange={(e) => { const sub = subjects.find(s => s.id === parseInt(e.target.value)); setSelectedSubject(sub); }}>
                    {subjects.filter(sub => {
                        // Filter out IC
                        if (sub.name === 'IC') return false;

                        // Check if subject is assigned to any faculty
                        const isAssigned = facultyList.some(fac => parseSubjects(fac.subjects).includes(sub.name));
                        // Also include if it's currently selected (to avoid it disappearing)
                        return isAssigned || (selectedSubject && selectedSubject.id === sub.id);
                    }).map(sub => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                </select><button className={styles.saveBtn} onClick={saveMarks}><Save size={16} /> Save Changes</button></div></div><p className={styles.helperText}>Edit marks directly in the table. Changes are tracked locally until saved. Max Marks: CIE-1 to CIE-5 (50 each) - Total (250)</p><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Sl. No.</th><th>Reg No</th><th>Student Name</th><th>Sem/Sec</th><th>CIE-1 (50)</th><th>CIE-2 (50)</th><th>CIE-3 (50)</th><th>CIE-4 (50)</th><th>CIE-5 (50)</th><th>Total (250)</th></tr></thead><tbody>{students.filter(s => selectedSemester === 'all' || s.semester == selectedSemester).map((student, index) => { const editMark = editingMarks[student.id] || {}; const valCIE1 = (editMark.cie1 !== undefined && editMark.cie1 !== null) ? editMark.cie1 : ''; const valCIE2 = (editMark.cie2 !== undefined && editMark.cie2 !== null) ? editMark.cie2 : ''; const valCIE3 = (editMark.cie3 !== undefined && editMark.cie3 !== null) ? editMark.cie3 : ''; const valCIE4 = (editMark.cie4 !== undefined && editMark.cie4 !== null) ? editMark.cie4 : ''; const valCIE5 = (editMark.cie5 !== undefined && editMark.cie5 !== null) ? editMark.cie5 : ''; const total = (Number(valCIE1) || 0) + (Number(valCIE2) || 0) + (Number(valCIE3) || 0) + (Number(valCIE4) || 0) + (Number(valCIE5) || 0); return (<tr key={student.id}><td>{index + 1}</td><td>{student.regNo}</td><td>{student.name}</td><td>{student.semester} - {student.section}</td><td><input type="number" className={styles.markInput} value={valCIE1} max={50} onChange={(e) => handleMarkChange(student.id, 'cie1', e.target.value)} /></td><td><input type="number" className={styles.markInput} value={valCIE2} max={50} onChange={(e) => handleMarkChange(student.id, 'cie2', e.target.value)} /></td><td><input type="number" className={styles.markInput} value={valCIE3} max={50} onChange={(e) => handleMarkChange(student.id, 'cie3', e.target.value)} /></td><td><input type="number" className={styles.markInput} value={valCIE4} max={50} onChange={(e) => handleMarkChange(student.id, 'cie4', e.target.value)} /></td><td><input type="number" className={styles.markInput} value={valCIE5} max={50} onChange={(e) => handleMarkChange(student.id, 'cie5', e.target.value)} /></td><td style={{ fontWeight: 'bold' }}>{Math.min(total, 250)}</td></tr>); })}</tbody></table></div></div></div>)}
            {activeTab === 'monitoring' && (<div className={styles.monitoringContainer}><div className={styles.card}><div className={styles.cardHeader}><h3>Subject-wise IA Submission Status</h3><div className={styles.filterGroup}><select className={styles.deptSelect} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}><option>All Semesters</option><option>2nd Semester</option><option>4th Semester</option></select></div></div><table className={styles.table}><thead><tr><th>Subject Name</th><th>Faculty</th><th>Status</th><th>Pending Count</th><th>Action</th></tr></thead><tbody>{subjects.filter(sub => sub.name !== 'IC' && sub.instructorName).map((subject, idx) => { const subjectMarks = subjectMarksData[subject.name] || []; const totalStudents = deptStudents.length; const studentsWithMarks = subjectMarks.filter(mark => mark.cie1Score !== null || mark.cie2Score !== null || mark.cie3Score !== null).length; const pendingCount = totalStudents - studentsWithMarks; let status = 'Pending'; if (pendingCount === 0) { status = 'Approved'; } else if (studentsWithMarks > 0) { status = 'Submitted'; } const facultyName = subject.instructorName || 'Not Assigned'; const facultyInitial = facultyName.charAt(0); return (<tr key={subject.id} style={{ transition: 'background 0.2s' }}><td style={{ fontWeight: 500 }}>{subject.name}</td><td><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{facultyInitial}</div><span>{facultyName}</span></div></td><td><span className={`${styles.statusBadge} ${status === 'Approved' ? styles.approved : status === 'Submitted' ? styles.submitted : styles.pending}`}>{status}</span></td><td>{pendingCount > 0 ? (<span style={{ color: '#ef4444', fontWeight: 500 }}>{pendingCount} Students</span>) : (<span style={{ color: '#94a3b8' }}>-</span>)}</td><td><button className={styles.secondaryBtn} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setViewingSubject({ name: subject.name, subjectId: subject.id, faculty: facultyName, status: status, pendingCount: pendingCount })}>View</button></td></tr>); })}</tbody></table></div>{viewingSubject && (<div className={styles.modalOverlay} onClick={() => setViewingSubject(null)}><div className={styles.modalContent} onClick={e => e.stopPropagation()}><div className={styles.modalHeader}><h2>{viewingSubject.name}</h2><button className={styles.closeBtn} onClick={() => setViewingSubject(null)}><X size={24} /></button></div><div className={styles.modalBody}><p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Faculty: <span style={{ color: '#111827', fontWeight: 600 }}>{viewingSubject.faculty}</span> <span className={`${styles.statusBadge} ${viewingSubject.status === 'Approved' ? styles.approved : viewingSubject.status === 'Submitted' ? styles.submitted : styles.pending}`} style={{ marginLeft: '10px' }}>{viewingSubject.status}</span></p><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Sl. No.</th><th>Reg No</th><th>Student Name</th><th>CIE-1</th><th>CIE-2</th><th>CIE-3</th><th>CIE-4</th><th>CIE-5</th><th>Total</th></tr></thead><tbody>{(() => { const subjectMarks = subjectMarksData[viewingSubject.name] || []; const studentsToShow = viewingSubject.status === 'Pending' ? deptStudents.filter(student => { const studentMark = subjectMarks.find(m => m.student?.regNo === student.regNo); return !studentMark || (studentMark.cie1Score === null && studentMark.cie2Score === null && studentMark.cie3Score === null); }) : deptStudents; return studentsToShow.map((student, index) => { const studentMark = subjectMarks.find(m => m.student?.regNo === student.regNo); const cie1 = studentMark?.cie1Score ?? '-'; const cie2 = studentMark?.cie2Score ?? '-'; const cie3 = studentMark?.cie3Score ?? '-'; const cie4 = studentMark?.cie4Score ?? '-'; const cie5 = studentMark?.cie5Score ?? '-'; const total = (studentMark?.cie1Score || 0) + (studentMark?.cie2Score || 0) + (studentMark?.cie3Score || 0) + (studentMark?.cie4Score || 0) + (studentMark?.cie5Score || 0); return (<tr key={student.id}><td>{index + 1}</td><td>{student.regNo}</td><td>{student.name}</td><td>{cie1}</td><td>{cie2}</td><td>{cie3}</td><td>{cie4}</td><td>{cie5}</td><td style={{ fontWeight: 'bold' }}>{studentMark ? total : '-'}</td></tr>); }); })()}</tbody></table></div></div></div></div>)}</div>)}
            {activeTab === 'performance' && (<div className={styles.performanceContainer}><div className={styles.statsRow}><div className={styles.statCard}><div className={`${styles.iconBox} ${styles.blue}`}><Users size={24} /></div><div className={styles.statInfo}><p>Total Students</p><h3>{deptStudents.length || 0}</h3></div></div><div className={styles.statCard}><div className={`${styles.iconBox} ${styles.green}`}><TrendingUp size={24} /></div><div className={styles.statInfo}><p>Class Average</p><h3>{analytics?.average || 0}/50</h3></div></div><div className={styles.statCard}><div className={`${styles.iconBox} ${styles.purple}`}><Award size={24} /></div><div className={styles.statInfo}><p>Pass Rate</p><h3>{analytics?.passPercentage || 0}%</h3></div></div><div className={styles.statCard}><div className={`${styles.iconBox} ${styles.orange}`}><AlertTriangle size={24} /></div><div className={styles.statInfo}><p>At Risk</p><h3>{analytics?.atRiskCount || 0}</h3></div></div></div><div className={styles.gridTwo}><div className={styles.card}><div className={styles.cardHeader}><h3>CIE Performance Trend</h3><select className={styles.deptSelect} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} value={performanceSubjectId} onChange={(e) => setPerformanceSubjectId(e.target.value)}><option value="all">All Subjects</option>{subjects.filter(s => s.name !== 'IC').map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div><div className={styles.chartContainer}><Bar data={{ labels: ['CIE-1', 'CIE-2', 'CIE-3', 'CIE-4', 'CIE-5'], datasets: [{ label: 'Class Average', data: cieTrendData, backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'], borderRadius: 8 }] }} options={{ ...commonOptions, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 50 } } }} /></div></div><div className={styles.card}><div className={styles.cardHeader}><h3>Grade Distribution</h3></div><div className={styles.doughnutContainer}><Doughnut data={hodGradeDistribution} options={doughnutOptions} /></div></div></div><div className={styles.card} style={{ marginTop: '1.5rem' }}><div className={styles.cardHeader}><h3>Subject-wise Performance</h3></div><table className={styles.table}><thead><tr><th>Subject</th><th>CIE-1 Avg</th><th>CIE-2 Avg</th><th>CIE-3 Avg</th><th>CIE-4 Avg</th><th>CIE-5 Avg</th><th>Overall</th><th>Pass %</th></tr></thead><tbody>{allSubjectPerformance.map((item) => (<tr key={item.id}><td style={{ fontWeight: 600 }}>{item.name}</td>{['CIE1', 'CIE2', 'CIE3', 'CIE4', 'CIE5'].map((cieType) => { const avg = item.averages[cieType] || 0; return (<td key={cieType}><span style={{ color: avg >= 40 ? '#16a34a' : avg >= 30 ? '#ca8a04' : '#dc2626', fontWeight: 500 }}>{avg}/50</span></td>); })}<td style={{ fontWeight: 700 }}>{item.overall}/50</td><td><span className={`${styles.statusBadge} ${item.passRate >= 80 ? styles.approved : item.passRate >= 60 ? styles.submitted : styles.pending}`}>{item.passRate}%</span></td></tr>))}</tbody></table></div><div className={styles.card} style={{ marginTop: '1.5rem' }}><div className={styles.cardHeader}><h3 style={{ color: '#dc2626' }}>⚠️ At-Risk Students (Action Required)</h3><button className={styles.secondaryBtn} style={{ fontSize: '0.85rem' }}><Download size={14} /> Export List</button></div><table className={styles.table}><thead><tr><th>Reg No</th><th>Student Name</th><th>CIE Average</th><th>Issue</th><th>Action</th></tr></thead><tbody>{atRiskStudents.map((student) => (<tr key={student.id}><td>{student.rollNo}</td><td style={{ fontWeight: 500 }}>{student.name}</td><td><span style={{ color: student.avgMarks < 20 ? '#dc2626' : '#ca8a04', fontWeight: 600 }}>{student.avgMarks}/50</span></td><td><span className={styles.issueTag}>{student.issue}</span></td><td><div style={{ display: 'flex', gap: '0.5rem' }}><button className={styles.secondaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => alert(`Sending notification to ${student.name}`)}>Notify</button><button className={styles.secondaryBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => alert(`Scheduling meeting with ${student.name}`)}>Meet</button></div></td></tr>))}</tbody></table></div></div>)}
            {activeTab === 'faculty' && (<div className={styles.facultyContainer}><div className={styles.card}><div className={styles.cardHeader}><h3>Department Faculty ({facultyList.length})</h3><div style={{ display: 'flex', gap: '1rem', position: 'relative' }}><button className={styles.primaryBtn} onClick={() => { setEditingFaculty(null); setFacultyForm({ fullName: '', username: '', email: '', password: 'password123', designation: 'Assistant Professor', subjects: '' }); setShowAddFacultyModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} /> Add New Faculty</button><div style={{ position: 'relative' }}><button className={styles.secondaryBtn} onClick={() => setShowEditSelection(!showEditSelection)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}><Edit size={16} /> Edit Faculty</button>{showEditSelection && (<div style={{ position: 'absolute', top: '110%', right: 0, width: '250px', background: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', zIndex: 100, padding: '0.5rem' }}><p style={{ padding: '0.5rem', fontSize: '0.85rem', color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>Select Faculty to Edit:</p><div style={{ maxHeight: '300px', overflowY: 'auto' }}>{facultyList.map(fac => (<button key={fac.id} onClick={() => { handleEditFaculty(fac); setShowEditSelection(false); }} style={{ width: '100%', textAlign: 'left', padding: '0.75rem', borderRadius: '6px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{fac.fullName || fac.username}</span><small style={{ color: '#64748b' }}>{fac.designation || 'Faculty'}</small></button>))}</div></div>)}</div></div></div><div className={styles.facultyList} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>{facultyList.length > 0 ? facultyList.map(fac => (<div key={fac.id} className={styles.facultyItem} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column' }}><div className={styles.facProfile} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}><div className={styles.avatarSm} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>{fac.fullName ? fac.fullName.charAt(0) : fac.username.charAt(0)}</div><div style={{ flex: 1 }}><p className={styles.facName} style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>{fac.fullName || fac.username}</p><small className={styles.facStatus} style={{ color: '#64748b' }}>{fac.designation || 'Faculty Member'}</small>{(fac.semester || fac.section) && (<small style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.8rem', marginTop: '2px', display: 'block' }}>Class Teacher: {fac.semester ? `${fac.semester} Sem` : ''} {fac.section ? `- Sec ${fac.section}` : ''}</small>)}</div></div><div style={{ marginBottom: '1rem', flex: 1 }}><span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Subjects ({parseSubjects(fac.subjects).length})</span><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>{parseSubjects(fac.subjects).length > 0 ? parseSubjects(fac.subjects).map((sub, i) => (<span key={i} style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>{sub}</span>)) : (<span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>No active subjects assigned</span>)}</div></div><div className={styles.facActions} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}><button className={styles.viewBtn} style={{ gridColumn: 'span 2' }} onClick={() => handleViewDashboard(fac)}><LayoutDashboard size={16} /> View Dashboard</button><button className={styles.msgBtn} onClick={() => handleMessage(fac)}><Mail size={16} /> Message</button><button className={styles.secondaryBtn} onClick={() => handleEditFaculty(fac)} style={{ border: '1px solid #e2e8f0', background: 'white', color: '#475569' }}><Edit size={16} /> Edit</button><button className={styles.secondaryBtn} onClick={() => openResetPasswordModal(fac.username, fac.fullName || fac.username, 'FACULTY')} style={{ border: '1px solid #fde68a', background: '#fef3c7', color: '#d97706' }}><Key size={14} /> Reset</button><button className={styles.secondaryBtn} onClick={() => handleDeleteFaculty(fac.id)} style={{ border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626' }}><Trash2 size={16} /> Remove</button></div></div>)) : (<div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#64748b' }}><Users size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} /><p>No faculty members found for this department.</p></div>)}</div></div>{showAddFacultyModal && (<div className={styles.modalOverlay}><div className={styles.modalContent} style={{ maxWidth: '500px' }}><div className={styles.modalHeader}><h3>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3><button className={styles.closeBtn} onClick={() => setShowAddFacultyModal(false)}><X size={24} /></button></div><div className={styles.modalBody}><form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><div className={styles.formGroup}><label>Full Name</label><input value={facultyForm.fullName} onChange={e => setFacultyForm({ ...facultyForm, fullName: e.target.value })} required placeholder="e.g. Dr. John Doe" className={styles.input} /></div><div className={styles.formGroup}><label>Username</label><input value={facultyForm.username} onChange={e => setFacultyForm({ ...facultyForm, username: e.target.value })} required placeholder="jdoe" className={styles.input} disabled={!!editingFaculty} /></div><div className={styles.formGroup}><label>Email</label><input value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} type="email" required placeholder="john@college.edu" className={styles.input} /></div>{!editingFaculty && (<div className={styles.formGroup}><label>Temporary Password</label><input value={facultyForm.password} onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })} required placeholder="password123" className={styles.input} /></div>)}<div className={styles.formGroup}><label>Designation</label><select value={facultyForm.designation} onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })} className={styles.input}><option>Assistant Professor</option><option>Associate Professor</option><option>Professor</option><option>Guest Faculty</option></select></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div className={styles.formGroup}><label>Class Teacher - Semester</label><select value={facultyForm.semester} onChange={e => setFacultyForm({ ...facultyForm, semester: e.target.value })} className={styles.input}><option value="">-- Select --</option><option value="1">1st Semester</option><option value="2">2nd Semester</option><option value="3">3rd Semester</option><option value="4">4th Semester</option><option value="5">5th Semester</option><option value="6">6th Semester</option></select></div><div className={styles.formGroup}><label>Section</label><input value={facultyForm.section} onChange={e => setFacultyForm({ ...facultyForm, section: e.target.value })} placeholder="e.g. A" className={styles.input} /></div></div><div className={styles.formGroup}>
                <label>Assigned Subjects</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem' }}>
                    {subjects.filter(s => s.department === selectedDept).map(sub => (
                        <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={Array.isArray(facultyForm.subjects)
                                    ? facultyForm.subjects.includes(sub.name)
                                    : (typeof facultyForm.subjects === 'string' && facultyForm.subjects.includes(sub.name))}
                                onChange={(e) => {
                                    const subName = sub.name;
                                    let current = [];
                                    if (Array.isArray(facultyForm.subjects)) {
                                        current = [...facultyForm.subjects];
                                    } else if (typeof facultyForm.subjects === 'string') {
                                        const trimmed = facultyForm.subjects.trim();
                                        current = trimmed ? trimmed.split(',').map(s => s.trim()).filter(s => s) : [];
                                    }

                                    if (e.target.checked) {
                                        if (!current.includes(subName)) current.push(subName);
                                    } else {
                                        current = current.filter(s => s !== subName);
                                    }
                                    setFacultyForm({ ...facultyForm, subjects: current });
                                }}
                            />
                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>{sub.name}</span>
                        </label>
                    ))}
                    {subjects.filter(s => s.department === selectedDept).length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No subjects found for this department.</p>}
                </div>
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Select the subjects this faculty will teach.</small>
            </div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}><button type="button" className={styles.secondaryBtn} onClick={() => setShowAddFacultyModal(false)}>Cancel</button><button type="submit" className={styles.primaryBtn} style={{ background: '#2563eb', color: 'white' }}>{editingFaculty ? 'Update Faculty' : 'Create Account'}</button></div></form></div></div></div>)}
                {viewingFaculty && (<div className={styles.modalOverlay} onClick={() => setViewingFaculty(null)}><div className={styles.modalContent} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}><div className={styles.modalHeader}><div><h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{viewingFaculty.fullName || viewingFaculty.username}</h2><span className={styles.badge} style={{ position: 'static', padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', fontWeight: 500, fontSize: '0.85rem' }}>Dashboard Overview</span></div><button className={styles.closeBtn} onClick={() => setViewingFaculty(null)}><X size={24} /></button></div><div className={styles.modalBody}>{(() => {
                    let totalAvg = 0;
                    let evaluatedCount = 0;
                    const subStats = parseSubjects(viewingFaculty.subjects).map(subName => {
                        const marks = subjectMarksData[subName] || [];
                        const validMarks = marks.filter(m => m.cie1Score !== null || m.cie2Score !== null || m.cie3Score !== null || m.cie4Score !== null || m.cie5Score !== null);
                        const avg = validMarks.length > 0 ? Math.round(validMarks.reduce((acc, m) => {
                            const scores = [m.cie1Score, m.cie2Score, m.cie3Score, m.cie4Score, m.cie5Score].filter(x => x !== null && x !== undefined);
                            const studentAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                            return acc + studentAvg;
                        }, 0) / validMarks.length) : 0;

                        if (validMarks.length > 0) evaluatedCount += validMarks.length;
                        totalAvg += avg;
                        return { name: subName, avg, count: validMarks.length };
                    });
                    const overall = subStats.length > 0 ? Math.round(totalAvg / subStats.length) : 0;

                    return (<><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}><div className={styles.statCard} style={{ background: '#f8fafc', border: 'none' }}><div className={`${styles.iconBox} ${styles.blue}`}><TrendingUp size={20} /></div><div><p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Avg Class Score</p><h3 style={{ margin: 0, fontSize: '1.25rem' }}>{overall > 0 ? overall : '-'}/50</h3></div></div><div className={styles.statCard} style={{ background: '#f8fafc', border: 'none' }}><div className={`${styles.iconBox} ${styles.green}`}><CheckCircle size={20} /></div><div><p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Students Evaluated</p><h3 style={{ margin: 0, fontSize: '1.25rem' }}>{evaluatedCount}</h3></div></div></div><div><h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Assigned Subjects Performance</h4><div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th>Subject</th><th>Avg Score</th><th>Status</th></tr></thead><tbody>{subStats.length > 0 ? subStats.map((s, i) => (<tr key={i}><td style={{ fontWeight: 500 }}>{s.name}</td><td>{s.avg || '-'}</td><td><span style={{ color: s.avg >= 35 ? '#16a34a' : s.avg >= 20 ? '#ca8a04' : '#dc2626', fontWeight: 600 }}>{s.avg >= 35 ? 'Good' : s.avg >= 20 ? 'Average' : 'Need Improvement'}</span></td></tr>)) : (<tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No subjects found</td></tr>)}</tbody></table></div></div></>);
                })()}</div></div></div>)}{messagingFaculty && (<div className={styles.modalOverlay} onClick={() => setMessagingFaculty(null)}><div className={styles.modalContent} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}><div className={styles.modalHeader}><h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={20} /> Message {messagingFaculty.username}</h3><button className={styles.closeBtn} onClick={() => setMessagingFaculty(null)}><X size={24} /></button></div><div className={styles.modalBody}><div className={styles.formGroup}><label>Message Content</label><textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message here..." className={styles.input} style={{ minHeight: '120px', resize: 'vertical' }} autoFocus></textarea></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}><button className={styles.secondaryBtn} onClick={() => setMessagingFaculty(null)}>Cancel</button><button className={styles.primaryBtn} onClick={sendMessage} disabled={!messageText.trim()} style={{ opacity: !messageText.trim() ? 0.6 : 1 }}>Send Message</button></div></div></div></div>)}</div>)}
            {activeTab === 'approvals' && (<div className={styles.approvalsContainer}><div className={styles.infoBanner}><CheckCircle size={20} /><p>You have <strong>{pendingApprovals.length}</strong> IA Bundles pending for final approval.</p></div>{approvalLoading ? (<div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading pending submissions...</div>) : pendingApprovals.length === 0 ? (<div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}><CheckCircle size={48} style={{ marginBottom: '1rem', color: '#10b981' }} /><p>No pending submissions. All marks have been reviewed!</p></div>) : (pendingApprovals.map((approval, idx) => (<div key={idx} className={styles.approvalCard}><div className={styles.approvalHeader}><div><h4>{approval.subjectName}</h4><span>{approval.iaType} Marks | Faculty: {approval.facultyName} | {approval.studentCount} students</span></div><div className={styles.approvlActions}><button className={styles.rejectBtn} onClick={() => handleRejectMarks(approval.subjectId, approval.iaType)}>Reject</button><button className={styles.approveBtn} onClick={() => handleApproveMarks(approval.subjectId, approval.iaType)}>Approve & Lock</button></div></div><table className={styles.miniTable}><thead><tr><th>Reg No</th><th>Student</th><th>Marks</th></tr></thead><tbody>{(Array.isArray(approval.marks) ? (expandedApprovals[idx] ? approval.marks : approval.marks.slice(0, 3)) : []).map(st => (<tr key={st.studentId}><td>{st.regNo}</td><td>{st.studentName}</td><td>{st.totalScore}/50</td></tr>))}{Array.isArray(approval.marks) && approval.marks.length > 3 && (<tr onClick={() => toggleExpansion(idx)} style={{ cursor: 'pointer', background: '#f8fafc' }}><td colSpan="3" style={{ textAlign: 'center', color: '#2563eb', fontWeight: 500 }}>{expandedApprovals[idx] ? 'Show Less' : `+ ${approval.marks.length - 3} more records (Click to expand)`}</td></tr>)}</tbody></table></div>)))}<div className={styles.card} style={{ marginTop: '1.5rem' }}><div className={styles.cardHeader}><h3>🔓 Unlock Approved Marks</h3><p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>Unlock approved marks to allow faculty to make corrections</p></div><div style={{ padding: '1.5rem' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}><div><label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label><select className={styles.select} id="unlockSubject" style={{ width: '100%', padding: '0.6rem' }}><option value="">Select Subject</option>{subjects.filter(s => s.name !== 'IC').map(subject => (<option key={subject.id} value={subject.id}>{subject.name} - {subject.instructorName}</option>))}</select></div><div><label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>CIE Type</label><select className={styles.select} id="unlockCIE" style={{ width: '100%', padding: '0.6rem' }}><option value="CIE1">CIE-1</option><option value="CIE2">CIE-2</option><option value="CIE3">CIE-3</option><option value="CIE4">CIE-4</option><option value="CIE5">CIE-5</option></select></div><button className={styles.dangerBtn} onClick={() => { const subjectId = document.getElementById('unlockSubject').value; const cieType = document.getElementById('unlockCIE').value; if (!subjectId) { alert('Please select a subject'); return; } const subject = subjects.find(s => s.id === parseInt(subjectId)); handleUnlockMarks(subjectId, cieType, subject?.name || 'Selected Subject'); }} style={{ padding: '0.6rem 1.5rem' }}>Unlock Marks</button></div><div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.85rem' }}><strong>⚠️ Warning:</strong> Unlocking marks will change their status from APPROVED to PENDING, allowing faculty to edit them again.</div></div></div></div>)}
            {activeTab === 'analytics' && (<div className={styles.analyticsContainer}><div className={styles.gridTwo}><div className={styles.card}><h3>IA Submission Status</h3><div className={styles.doughnutContainer}><Pie data={iaSubmissionStatus} options={doughnutOptions} /></div></div><div className={styles.card}><h3>Year-on-Year Improvement</h3><div className={styles.chartContainer}><Line data={hodTrendData} options={commonOptions} /></div></div></div><div className={styles.card} style={{ marginTop: '1.5rem' }}><h3>Download Reports</h3><div className={styles.downloadOptions}><button className={styles.downloadBtn}><FileText size={16} /> Department IA Report (PDF)</button><button className={styles.downloadBtn}><FileText size={16} /> Consolidated Marks Sheet (Excel)</button><button className={styles.downloadBtn}><FileText size={16} /> Low Performers List (CSV)</button></div></div></div>)}
            {activeTab === 'lesson-plans' && (<div className={styles.lessonPlansContainer}><div className={styles.card}><div className={styles.cardHeader}><h3>Department Syllabus Progress</h3></div><div className={styles.gridContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(350px,1fr))', gap: '1.5rem', marginTop: '1rem' }}>{subjectsByDept[selectedDept]?.map((subName, idx) => { const subId = idx + 1; const realSub = subjects.find(s => s.name === subName); const idToUse = realSub ? realSub.id : subId; const savedTracker = localStorage.getItem('syllabusTracker'); const progress = savedTracker ? (JSON.parse(savedTracker)[idToUse] || {}) : {}; const savedStructure = localStorage.getItem('syllabusStructure'); const structure = savedStructure ? (JSON.parse(savedStructure)[idToUse] || []) : []; const savedCie = localStorage.getItem('cieSelector'); const cieSelector = savedCie ? (JSON.parse(savedCie)[idToUse] || {}) : {}; const units = structure.length > 0 ? structure : [{ id: 'u1', name: 'Unit 1: Introduction' }, { id: 'u2', name: 'Unit 2: Core Concepts' }, { id: 'u3', name: 'Unit 3: Advanced Topics' }, { id: 'u4', name: 'Unit 4: Application' }, { id: 'u5', name: 'Unit 5: Case Studies' }]; const completedCount = units.filter(u => progress[u.id]).length; const totalUnits = units.length; const percent = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0; return (<div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><div><h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#111827' }}>{subName}</h4><span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Faculty: {facultyWorkload[idx % facultyWorkload.length]?.name || 'Unknown'}</span></div><div style={{ textAlign: 'right' }}><span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: percent === 100 ? '#10b981' : '#3b82f6' }}>{percent}%</span></div></div><div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}><div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.5s ease' }}></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{units.slice(0, 3).map(u => (<div key={u.id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: progress[u.id] ? '#374151' : '#9ca3af' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: progress[u.id] ? '#10b981' : '#d1d5db', background: progress[u.id] ? '#10b981' : 'transparent', marginRight: '8px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{progress[u.id] && <CheckCircle size={10} color="white" />}</div><span style={{ textDecoration: progress[u.id] ? 'line-through' : 'none', marginRight: '8px' }}>{u.name}</span>{cieSelector[u.id] && (<span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #7c3aed', marginLeft: 'auto' }}>CIE</span>)}</div>))}{units.length > 3 && (<div style={{ fontSize: '0.8rem', color: '#6b7280', paddingLeft: '24px' }}>+ {units.length - 3} more topics</div>)}</div></div>); })}</div></div></div>)}
            {activeTab === 'syllabus' && (<div className={styles.sectionContainer}>
                <div className={styles.gridTwo}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3><BookOpen size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Add / Update Syllabus</h3></div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Select Subject</label>
                                <select className={styles.deptSelect} style={{ width: '100%', padding: '0.6rem' }} value={syllabusForm.subjectId} onChange={e => setSyllabusForm({ ...syllabusForm, subjectId: e.target.value })}>
                                    <option value="">-- Choose Subject --</option>
                                    {subjects.filter(s => s.name !== 'IC').map(sub => (<option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>CIE Number</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <label key={num} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: syllabusForm.cieNumber === String(num) ? '#eff6ff' : 'white', borderColor: syllabusForm.cieNumber === String(num) ? '#3b82f6' : '#cbd5e1', color: syllabusForm.cieNumber === String(num) ? '#2563eb' : '#64748b', fontWeight: syllabusForm.cieNumber === String(num) ? '600' : '400' }}>
                                            <input type="radio" name="syllabusCie" value={num} checked={syllabusForm.cieNumber === String(num)} onChange={() => setSyllabusForm({ ...syllabusForm, cieNumber: String(num) })} style={{ display: 'none' }} />CIE-{num}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Syllabus Topics</label>
                                <textarea className={styles.input} style={{ minHeight: '140px', resize: 'vertical', fontFamily: 'inherit' }} placeholder={'Enter syllabus topics covered under this CIE...\n\nExample:\n- Unit 1: Introduction to Data Structures\n- Unit 2: Arrays and Linked Lists\n- Unit 3: Stacks and Queues'} value={syllabusForm.syllabus} onChange={e => setSyllabusForm({ ...syllabusForm, syllabus: e.target.value })} />
                            </div>
                            <button className={styles.primaryBtn} style={{ justifyContent: 'center', padding: '0.75rem' }} disabled={syllabusLoading || !syllabusForm.subjectId || !syllabusForm.syllabus.trim()} onClick={async () => {
                                setSyllabusLoading(true);
                                try {
                                    const token = user?.token;
                                    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
                                    const payload = { subjectId: parseInt(syllabusForm.subjectId), cieNumber: syllabusForm.cieNumber, syllabusCoverage: syllabusForm.syllabus };
                                    const res = await fetch(`${API_BASE_URL}/cie/hod/announcements/syllabus`, { method: 'PUT', headers, body: JSON.stringify(payload) });
                                    if (res.ok) {
                                        alert('Syllabus updated successfully!');
                                        setSyllabusForm({ ...syllabusForm, syllabus: '' });
                                        // Refresh announcements
                                        const annRes = await fetch(`${API_BASE_URL}/cie/announcements?department=${selectedDept}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                        if (annRes.ok) setDepartmentAnnouncements(await annRes.json());
                                    } else {
                                        const err = await res.json();
                                        alert(err.message || 'Failed to update syllabus.');
                                    }
                                } catch (e) { console.error(e); alert('Error updating syllabus'); }
                                setSyllabusLoading(false);
                            }}><BookOpen size={16} /> {syllabusLoading ? 'Saving...' : 'Save Syllabus'}</button>
                            <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.85rem', color: '#0369a1', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>You can add syllabus topics for any subject and CIE number. If a CIE schedule already exists, the syllabus will be attached to it.</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3>Existing Syllabus Entries</h3></div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {departmentAnnouncements.filter(a => a.syllabusCoverage).length > 0 ? departmentAnnouncements.filter(a => a.syllabusCoverage).map(ann => (
                                <div key={ann.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{ann.subject?.name || 'Unknown Subject'}</h4>
                                        <span className={styles.statusBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>CIE-{ann.cieNumber}</span>
                                    </div>
                                    <pre style={{ margin: 0, fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>{ann.syllabusCoverage}</pre>
                                    <button className={styles.secondaryBtn} style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => {
                                        setSyllabusForm({ subjectId: String(ann.subject?.id || ''), cieNumber: String(ann.cieNumber), syllabus: ann.syllabusCoverage || '' });
                                    }}><Edit size={12} /> Edit</button>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    <BookOpen size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
                                    <p>No syllabus entries yet.</p>
                                    <p style={{ fontSize: '0.85rem' }}>Add syllabus topics for your CIE schedules.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Add New Subject Section */}
                <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.cardHeader}><h3><Layers size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Add New Subject</h3></div>
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Subject Name *</label>
                                <input className={styles.input} id="newSubjectName" placeholder="e.g. Data Structures" />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Subject Code *</label>
                                <input className={styles.input} id="newSubjectCode" placeholder="e.g. 21CS32" />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Semester</label>
                                <select className={styles.deptSelect} id="newSubjectSemester" style={{ width: '100%', padding: '0.6rem' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Credits</label>
                                <input className={styles.input} id="newSubjectCredits" type="number" placeholder="e.g. 4" defaultValue="4" />
                            </div>
                            <div className={styles.formGroup}>
                                <label style={{ fontWeight: 600 }}>Instructor Name</label>
                                <input className={styles.input} id="newSubjectInstructor" placeholder="e.g. Dr. Smith" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className={styles.primaryBtn} style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }} onClick={async () => {
                                    const name = document.getElementById('newSubjectName').value.trim();
                                    const code = document.getElementById('newSubjectCode').value.trim();
                                    const semester = document.getElementById('newSubjectSemester').value;
                                    const credits = document.getElementById('newSubjectCredits').value;
                                    const instructorName = document.getElementById('newSubjectInstructor').value.trim();
                                    if (!name || !code) { alert('Subject name and code are required.'); return; }
                                    try {
                                        const token = user?.token;
                                        const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
                                        const res = await fetch(`${API_BASE_URL}/subjects`, {
                                            method: 'POST', headers,
                                            body: JSON.stringify({ name, code, department: selectedDept, semester: parseInt(semester), credits: parseInt(credits), instructorName })
                                        });
                                        if (res.ok) {
                                            alert('Subject added successfully!');
                                            document.getElementById('newSubjectName').value = '';
                                            document.getElementById('newSubjectCode').value = '';
                                            document.getElementById('newSubjectInstructor').value = '';
                                            // Refresh subjects list
                                            const subRes = await fetch(`${API_BASE_URL}/subjects/department/${selectedDept}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                            if (subRes.ok) setSubjects(await subRes.json());
                                        } else {
                                            const err = await res.json();
                                            alert(err.message || 'Failed to add subject.');
                                        }
                                    } catch (e) { console.error(e); alert('Error adding subject.'); }
                                }}><Layers size={16} /> Add Subject</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Existing Subjects Table */}
                <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.cardHeader}><h3>Department Subjects ({subjects.length})</h3></div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead><tr><th>Name</th><th>Code</th><th>Semester</th><th>Credits</th><th>Instructor</th><th>Action</th></tr></thead>
                            <tbody>
                                {subjects.length > 0 ? subjects.map(sub => (
                                    <tr key={sub.id}>
                                        <td style={{ fontWeight: 500 }}>{sub.name}</td>
                                        <td><span className={styles.statusBadge} style={{ background: '#f1f5f9', color: '#334155' }}>{sub.code}</span></td>
                                        <td>Sem {sub.semester || '-'}</td>
                                        <td>{sub.credits || '-'}</td>
                                        <td>{sub.instructorName || '-'}</td>
                                        <td>
                                            <button className={styles.iconBtn} style={{ color: '#dc2626', background: '#fee2e2' }} title="Delete" onClick={async () => {
                                                if (!window.confirm(`Delete subject "${sub.name}"? This cannot be undone.`)) return;
                                                try {
                                                    const token = user?.token;
                                                    const res = await fetch(`${API_BASE_URL}/subjects/${sub.id}`, { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
                                                    if (res.ok) {
                                                        setSubjects(prev => prev.filter(s => s.id !== sub.id));
                                                        alert('Subject deleted.');
                                                    } else { alert('Failed to delete subject.'); }
                                                } catch (e) { alert('Error deleting subject.'); }
                                            }}><Trash2 size={14} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No subjects found for this department.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>)}
            {activeTab === 'cie-schedule' && (<div className={styles.cieScheduleContainer}><div className={styles.gridTwo}><div className={styles.card}><h3>{editingScheduleId ? 'Edit CIE Exam Schedule' : 'Schedule New CIE Exam'}</h3><form onSubmit={handleScheduleSubmit} id="scheduleFormSection" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}><div className={styles.formGroup}><label>Select Subject</label><select name="subjectId" required className={styles.deptSelect} style={{ width: '100%' }}><option value="">-- Choose Subject --</option>{subjects.map(sub => (<option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>))}</select></div><div className={styles.formGroup}><label>CIE Number</label><div style={{ display: 'flex', gap: '0.5rem' }}>{[1, 2, 3, 4, 5].map(num => (<label key={num} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: scheduleForm.cieNumber === num ? '#eff6ff' : 'white', borderColor: scheduleForm.cieNumber === num ? '#3b82f6' : '#cbd5e1', color: scheduleForm.cieNumber === num ? '#2563eb' : '#64748b', fontWeight: scheduleForm.cieNumber === num ? '600' : '400' }}><input type="radio" name="cieNumber" value={num} checked={scheduleForm.cieNumber === num} onChange={() => setScheduleForm({ ...scheduleForm, cieNumber: num })} style={{ display: 'none' }} />CIE-{num}</label>))}</div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div className={styles.formGroup}><label>Date</label><input type="date" name="scheduledDate" required className={styles.input} /></div><div className={styles.formGroup}><label>Time</label><input type="time" name="startTime" required className={styles.input} /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div className={styles.formGroup}><label>Duration (mins)</label><input type="number" name="durationMinutes" defaultValue="60" className={styles.input} /></div><div className={styles.formGroup}><label>Room / Hall</label><input name="examRoom" placeholder="e.g. LH-201" className={styles.input} /></div></div><div className={styles.formGroup}><label>Integration Instructions (Optional)</label><textarea name="instructions" placeholder="Special instructions for faculty/students..." className={styles.input} style={{ minHeight: '80px', resize: 'vertical' }}></textarea></div><div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>{editingScheduleId && (<button type="button" className={styles.secondaryBtn} onClick={cancelEdit} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>)}<button type="submit" className={styles.primaryBtn} style={{ flex: 2, justifyContent: 'center' }}><Megaphone size={18} /> {editingScheduleId ? 'Update Schedule' : 'Publish Schedule'}</button></div></form></div><div className={styles.card}><h3>Upcoming Scheduled Exams</h3><div className={styles.alertList}>{departmentAnnouncements.length > 0 ? departmentAnnouncements.map(ann => (<div key={ann.id} className={`${styles.alertItem} ${styles.info}`} style={{ alignItems: 'center' }}><div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', minWidth: '60px' }}><span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>{new Date(ann.scheduledDate).getDate()}</span><span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>{new Date(ann.scheduledDate).toLocaleString('default', { month: 'short' })}</span></div><div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#1e293b' }}>{ann.subject ? ann.subject.name : 'Unknown Subject'} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>({ann.subject?.code})</span></h4><span className={styles.statusBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>CIE-{ann.cieNumber}</span></div><p style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: '#475569', fontSize: '0.85rem' }}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {ann.startTime || '10:00 AM'} ({ann.durationMinutes}m)</span>{ann.examRoom && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {ann.examRoom}</span>}</p></div><div style={{ display: 'flex', gap: '8px' }}><button className={styles.iconBtn} onClick={() => handleEditSchedule(ann)} title="Edit" style={{ color: '#2563eb', background: '#dbeafe' }}><Edit size={16} /></button><button className={styles.iconBtn} onClick={() => handleDeleteSchedule(ann.id)} title="Delete" style={{ color: '#dc2626', background: '#fee2e2' }}><Trash2 size={16} /></button></div></div>)) : (<div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No exams scheduled yet.</div>)}</div></div></div></div>)}
            {activeTab === 'reports' && (<div className={styles.sectionContainer}><h2 className={styles.sectionTitle}>Reports & Archives</h2><div className={styles.cardsGrid}><div className={styles.card}><div className={styles.cardHeader}><h3 className={styles.cardTitle}>IA Marks Report</h3></div><div style={{ padding: '1rem', color: '#666' }}><p>Download comprehensive PDF report of IA marks for all subjects in {selectedDept}.</p><button className={styles.primaryBtn} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => window.open(`${API_BASE_URL}/reports/marks/${selectedDept}/pdf`, '_blank')}><Download size={18} /> Download PDF</button></div></div></div></div>)}
        </>
    );


    if (isSpectator) {
        // Spectator mode (embedded from PrincipalDashboard) - no DashboardLayout
        return (
            <div style={{ padding: '1rem', height: 'auto', overflow: 'visible' }}>
                <header style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{departments.find(d => d.id === selectedDept)?.name} Console</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>Read-Only Mode</span>
                    </div>
                    <nav style={{ display: 'flex', gap: '10px' }}>
                        {menuItems.filter(m => ['overview', 'monitoring', 'performance', 'all-students'].includes(m.path.replace('#', ''))).map((item, index) => (
                            <button key={index}
                                onClick={() => setActiveTab(item.path.replace('#', ''))}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                                    background: activeTab === item.path.replace('#', '') ? '#3b82f6' : 'transparent',
                                    color: activeTab === item.path.replace('#', '') ? 'white' : '#64748b',
                                    cursor: 'pointer', fontWeight: 500
                                }}>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </header>
                <div>
                    {!isMyDept ? (<AccessDeniedView />) : renderContent()}
                </div>
                {renderStudentProfileModal()}
                {renderResetPasswordModal()}
            </div>
        );
    }

    return (
        <DashboardLayout menuItems={menuItems}>
            {/* Faculty-style Header */}
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.welcomeTextBig}>Hello, {user?.fullName || user?.username}</h1>
                        <p className={styles.subtitle}>Head of {departments.find(d => d.id === selectedDept)?.name} | HOD</p>
                    </div>
                </div>
            </header>
            <div className={styles.scrollableContent}>
                {!isMyDept ? (<AccessDeniedView />) : renderContent()}
            </div>
            {renderStudentProfileModal()}
            {renderResetPasswordModal()}
        </DashboardLayout>
    );
};

export default HODDashboard;
