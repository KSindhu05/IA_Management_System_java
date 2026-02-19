import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import styles from './PrincipalDashboard.module.css';
import {
    LayoutDashboard, Users, ShieldCheck, Calendar, BarChart2,
    Briefcase, Bell, AlertTriangle, FileText, Building, LogOut
} from 'lucide-react';
import headerLogo from '../assets/header_logo.png';

// Import Extracted Components
import { ToastNotification, SimpleModal } from '../components/dashboard/principal/Shared';
import { StudentSentinel } from '../components/dashboard/principal/Widgets';
import OverviewSection from '../components/dashboard/principal/OverviewSection';
import ComplianceSection from '../components/dashboard/principal/ComplianceSection';
import DepartmentSection from '../components/dashboard/principal/DepartmentSection';
// import FacultySection from '../components/dashboard/principal/FacultySection'; // Replaced by FacultyDirectorySection
import { DirectorySection } from '../components/dashboard/principal/DirectorySection';
import {
    FacultyDirectorySection, CIEScheduleSection,
    ReportsSection, NotificationsSection
} from '../components/dashboard/principal/SectionComponents';

import {
    fetchPrincipalDashboard, fetchAllFaculty, fetchTimetables,
    fetchNotifications, fetchReports
} from '../services/api';

const PrincipalDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [dashboardData, setDashboardData] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);

    // Directory State
    const [selectedDept, setSelectedDept] = useState(null);
    const [deptStudents, setDeptStudents] = useState([]);

    // Interaction State
    const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Notification Sending State
    const [msgRecipientType, setMsgRecipientType] = useState('HOD');
    const [msgTargetDept, setMsgTargetDept] = useState('ALL');
    const [msgText, setMsgText] = useState('');

    // Fetch All Data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const token = user?.token;
                console.log("DEBUG: Fetching Principal Dashboard with token:", token ? "Present" : "Missing");
                setLoading(true);

                // Parallel fetching of all required data
                const [
                    dashData,
                    faculty,
                    times,
                    notifs,
                    reps
                ] = await Promise.all([
                    fetchPrincipalDashboard(token),
                    fetchAllFaculty(token),
                    fetchTimetables(token),
                    fetchNotifications(token),
                    fetchReports(token)
                ]);

                if (dashData) setDashboardData(dashData);
                if (faculty) setFacultyList(faculty);
                if (times) setTimetables(times);
                if (notifs) setNotifications(notifs);
                if (reps) setReports(reps);

            } catch (error) {
                console.error("Failed to load dashboard data details:", error);
                if (error.response) {
                    console.error("Response status:", error.response.status);
                    console.error("Response data:", await error.response.json());
                }
                showToast("Failed to load live data: " + error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadDashboardData();
        }
    }, [user]);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3000);
    }, []);

    const handleDownload = useCallback((item) => showToast(`Downloading ${item.name || 'document'}...`, 'info'), [showToast]);
    const handleNewBroadcast = useCallback(() => setActiveModal('broadcast'), []);
    const handleSaveFaculty = useCallback((e) => { e.preventDefault(); setActiveModal(null); showToast('Faculty Saved', 'success'); }, [showToast]);

    // MENU ITEMS - format compatible with Sidebar component
    const menuItems = [
        { label: 'Overview', path: '#overview', icon: <LayoutDashboard size={20} />, isActive: activeTab === 'overview', onClick: () => setActiveTab('overview') },
        { label: 'Departments', path: '#departments', icon: <Building size={20} />, isActive: activeTab === 'departments', onClick: () => setActiveTab('departments') },
        { label: 'Faculty Directory', path: '#faculty', icon: <Briefcase size={20} />, isActive: activeTab === 'faculty', onClick: () => setActiveTab('faculty') },
        { label: 'Student Search', path: '#directory', icon: <Users size={20} />, isActive: activeTab === 'directory', onClick: () => { setActiveTab('directory'); setSelectedDept(null); } },
        { label: 'CIE Schedule', path: '#timetables', icon: <Calendar size={20} />, isActive: activeTab === 'timetables', onClick: () => setActiveTab('timetables') },
        { label: 'CIE Compliance', path: '#compliance', icon: <ShieldCheck size={20} />, isActive: activeTab === 'compliance', onClick: () => setActiveTab('compliance') },
        { label: 'Reports & Analytics', path: '#reports', icon: <FileText size={20} />, isActive: activeTab === 'reports', onClick: () => setActiveTab('reports') },
        { label: 'Notifications', path: '#notifications', icon: <Bell size={20} />, isActive: activeTab === 'notifications', onClick: () => setActiveTab('notifications') }
    ];

    /* Chart Configs and Helper Logic */
    const barData = useMemo(() => {
        if (!dashboardData) return null;
        return {
            labels: dashboardData.branches || ['CS', 'EC', 'ME', 'CV'],
            datasets: [{
                label: 'Avg CIE Performance (%)',
                data: dashboardData.branchPerformance || [0, 0, 0, 0],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                borderRadius: 6
            }]
        };
    }, [dashboardData]);

    const departments = useMemo(() => {
        if (!dashboardData?.branches) return [];
        return dashboardData.branches.map(branch => {
            const hodInfo = dashboardData.hodSubmissionStatus?.find(h => h.dept === branch);
            return {
                id: branch,
                name: (branch === 'CS' || branch === 'CSE') ? 'Computer Science' : branch === 'ME' ? 'Mechanical' : (branch === 'EC' || branch === 'ECE') ? 'Electronics' : branch === 'CV' ? 'Civil' : branch,
                hod: hodInfo ? hodInfo.hod : 'Unknown',
                color: (branch === 'CS' || branch === 'CSE') ? '#3b82f6' : branch === 'ME' ? '#f59e0b' : (branch === 'EC' || branch === 'ECE') ? '#8b5cf6' : '#10b981'
            };
        });
    }, [dashboardData]);

    const handleDeptClick = useCallback((dept) => {
        setSelectedDept(dept);
        // Students are fetched by DirectorySection internally based on selectedDept
        setDeptStudents([]);
    }, []);

    const handleRemoveFaculty = useCallback(() => setActiveModal('removeFaculty'), []);

    // const handleViewGrievance = useCallback((g) => {
    //     setSelectedItem(g);
    //     setActiveModal('grievance');
    // }, []);

    // --- Notification Handlers ---
    const API_BASE_URL = 'http://127.0.0.1:8084/api';

    const handleSendNotification = useCallback(async () => {
        if (!msgText.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user?.username || 'principal',
                    message: msgText,
                    targetRole: msgRecipientType,
                    department: msgTargetDept
                })
            });
            const data = await res.json();
            showToast(data.message || 'Message sent!', 'success');
            setMsgText('');
        } catch (err) {
            console.error('Send notification error:', err);
            showToast('Failed to send notification', 'error');
        }
    }, [msgText, msgRecipientType, msgTargetDept, user, showToast]);

    const handleClearNotifications = useCallback(async () => {
        try {
            const token = user?.token;
            await fetch(`${API_BASE_URL}/notifications/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications([]);
            showToast('Notifications cleared', 'info');
        } catch (err) {
            console.error('Clear notifications error:', err);
            showToast('Failed to clear notifications', 'error');
        }
    }, [user, showToast]);

    const handleDeleteNotification = useCallback(async (id) => {
        try {
            const token = user?.token;
            await fetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Delete notification error:', err);
            showToast('Failed to delete notification', 'error');
        }
    }, [user, showToast]);

    const handleLogout = () => {
        logout();
    };

    return (
        <DashboardLayout menuItems={menuItems}>
            {/* --- HEADER (Faculty-style) --- */}
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.welcomeText}>Hello, Dr. Gowri Shankar</h1>
                        <p className={styles.subtitle}>Principal | Sanjay Gandhi Polytechnic</p>
                    </div>
                    <div className={styles.headerActions}>
                        <StudentSentinel students={deptStudents} />
                        <select className={styles.yearSelector}>
                            <option>Academic Year 2025-26</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Dynamic Content */}
            <div className={styles.sectionVisible}>
                {activeTab === 'overview' && (
                    loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading Dashboard...</div> :
                        <OverviewSection
                            stats={dashboardData?.stats}
                            chartData={barData}
                            branches={dashboardData?.branches}
                            branchPerformance={dashboardData?.branchPerformance}
                            lowPerformers={dashboardData?.lowPerformers}
                            facultyAnalytics={dashboardData?.facultyAnalytics}
                            schedule={dashboardData?.dates}
                            approvals={dashboardData?.approvals}
                            cieStats={dashboardData?.cieStats}
                            trends={dashboardData?.trends}
                            hodSubmissionStatus={dashboardData?.hodSubmissionStatus}
                            onNavigate={setActiveTab}
                        />
                )}

                {activeTab === 'compliance' && <ComplianceSection hodSubmissionStatus={dashboardData?.hodSubmissionStatus} />}

                {activeTab === 'departments' && <DepartmentSection departments={departments} facultyList={facultyList} />}

                {activeTab === 'directory' && <DirectorySection
                    departments={departments}
                    selectedDept={selectedDept}
                    deptStudents={deptStudents}
                    handleDeptClick={handleDeptClick}
                    setSelectedDept={setSelectedDept}
                />}

                {activeTab === 'faculty' && <FacultyDirectorySection facultyMembers={facultyList} onRemove={handleRemoveFaculty} />}

                {activeTab === 'timetables' && <CIEScheduleSection schedules={timetables} onDownload={handleDownload} />}
                {activeTab === 'notifications' && <NotificationsSection
                    notifications={notifications}
                    recipientType={msgRecipientType}
                    setRecipientType={setMsgRecipientType}
                    targetDept={msgTargetDept}
                    setTargetDept={setMsgTargetDept}
                    messageText={msgText}
                    setMessageText={setMsgText}
                    onSend={handleSendNotification}
                    onClear={handleClearNotifications}
                    onDelete={handleDeleteNotification}
                />}
                {activeTab === 'reports' && <ReportsSection reports={reports} onDownload={handleDownload} />}
            </div>

            {/* Interaction Modals */}
            <ToastNotification show={toast.show} msg={toast.msg} type={toast.type} />

            <SimpleModal isOpen={activeModal === 'removeFaculty'} onClose={() => setActiveModal(null)} title="Remove Faculty">
                <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); showToast('Faculty Removed', 'success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        Are you sure you want to remove a faculty member? This action cannot be undone.
                    </p>
                    <input className={styles.searchBarInput} placeholder="Enter Faculty ID to Remove" required style={{ border: '1px solid #e2e8f0' }} />
                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '0.5rem', justifyContent: 'center', background: '#ef4444' }}>Confirm Removal</button>
                </form>
            </SimpleModal>
        </DashboardLayout>
    );
};

export default PrincipalDashboard;
