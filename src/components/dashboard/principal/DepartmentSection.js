import React, { useState, useEffect } from 'react';
import { Users, Briefcase, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import styles from '../../../pages/PrincipalDashboard.module.css';
import API_BASE_URL from '../../../config/api';

import { useAuth } from '../../../context/AuthContext';
import { ToastNotification, SimpleModal } from './Shared';

const DepartmentCard = ({ dept, onSelect }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch real stats for this specific department
                const token = user?.token;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const response = await fetch(`${API_BASE_URL}/analytics/department/${dept.id}/stats`, { headers });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    console.warn(`Failed to fetch stats for ${dept.id}: ${response.status}`);
                    setStats({
                        studentCount: 0,
                        facultyCount: 0,
                        passPercentage: 0,
                        atRiskCount: 0
                    });
                }
            } catch (error) {
                console.error(`Failed to load stats for ${dept.id}`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [dept.id, user]);

    return (
        <div className={styles.glassCard} style={{
            padding: '1rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: `4px solid ${dept.color}`,
            transition: 'transform 0.2s',
            cursor: 'pointer'
        }}
            onClick={() => onSelect(dept)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{dept.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>HOD: {dept.hod}</span>
                    </div>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${dept.color}20`, color: dept.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Briefcase size={16} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.6rem' }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem 0.6rem', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Users size={12} color="#64748b" />
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Students</span>
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                            {loading ? '...' : (stats?.studentCount || 0)}
                        </span>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '0.5rem 0.6rem', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <AlertTriangle size={12} color="#ef4444" />
                            <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>At Risk</span>
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>
                            {loading ? '...' : (stats?.atRiskCount || 0)}
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                        <span style={{ color: '#64748b' }}>Pass Percentage</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>{loading ? '-' : stats?.passPercentage}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                        <div style={{
                            width: `${loading ? 0 : stats?.passPercentage}%`,
                            height: '100%',
                            background: '#16a34a',
                            borderRadius: '3px',
                            transition: 'width 1s ease-out'
                        }}></div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Details <ArrowRight size={14} />
                </span>
            </div>
        </div>
    );
};



const DepartmentDetails = ({ dept, onBack, allFaculty }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Student Modal State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [studentList, setStudentList] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = user?.token;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${API_BASE_URL}/analytics/department/${dept.id}/stats`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dept stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dept.id, user]);

    const handleStudentClick = async () => {
        setShowStudentModal(true);
        setLoadingStudents(true);
        try {
            const token = user?.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`${API_BASE_URL}/principal/students/${dept.id}`, { headers });
            if (response.ok) {
                const data = await response.json();
                setStudentList(data);
            } else {
                console.error("Failed to fetch students");
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Filter faculty for this department
    const deptFaculty = allFaculty.filter(f =>
        f.department === dept.id ||
        f.department === dept.name ||
        (dept.id === 'CS' && f.department === 'CSE') // Handle potential mismatch
    );

    return (
        <div className={styles.glassCard} style={{ padding: '2rem', animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>{dept.name}</h2>
                        <span style={{ color: '#64748b' }}>Head of Department: {dept.hod}</span>
                    </div>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: dept.color + '20', color: dept.color, borderRadius: '8px', fontWeight: 600 }}>
                    {dept.id} Department
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div
                    onClick={handleStudentClick}
                    style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Students</span>
                        <Users size={20} color='#3b82f6' />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>
                        {loading ? '...' : (stats?.studentCount || 0)}
                    </div>
                </div>

                {[
                    { label: 'Total Faculty', value: stats?.facultyCount || 0, icon: Briefcase, color: '#8b5cf6' },
                    { label: 'Pass Percentage', value: `${stats?.passPercentage || 0}%`, icon: TrendingUp, color: '#10b981' },
                    { label: 'Students At Risk', value: stats?.atRiskCount || 0, icon: AlertTriangle, color: '#ef4444' }
                ].map((stat, i) => (
                    <div key={i} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{stat.label}</span>
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>
                            {loading ? '...' : stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#334155' }}>Faculty Members</h3>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Designation</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Subjects</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deptFaculty.length > 0 ? deptFaculty.map((f, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', color: '#334155', fontWeight: 500 }}>{f.fullName} ({f.username})</td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{f.designation || 'Faculty'}</td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{f.subjects || '-'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No faculty found for this department.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#334155' }}>Performance Trend</h3>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}>
                        <span style={{ color: '#94a3b8' }}>Chart Placeholder</span>
                    </div>
                </div>
            </div>

            {/* Student List Modal */}
            <SimpleModal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title={`${dept.name} Students`}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {loadingStudents ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading students...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Reg No</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Name</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b' }}>Sem/Sec</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentList.length > 0 ? studentList.map((s, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem', color: '#334155', fontWeight: 500 }}>{s.regNo}</td>
                                        <td style={{ padding: '0.75rem', color: '#334155' }}>{s.name}</td>
                                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{s.semester} / {s.section}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No students found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </SimpleModal>
        </div>
    );
};

const DepartmentSection = ({ departments, facultyList = [] }) => {
    const [selectedDept, setSelectedDept] = useState(null);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 className={styles.chartTitle} style={{ fontSize: '1.5rem' }}>Department Monitoring</h2>
                <p style={{ color: '#64748b' }}>Overview of department performance, faculty compliance, and student risk levels.</p>
            </div>

            {selectedDept ? (
                <DepartmentDetails
                    dept={selectedDept}
                    onBack={() => setSelectedDept(null)}
                    allFaculty={facultyList}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
                    {departments.map(dept => (
                        <DepartmentCard
                            key={dept.id}
                            dept={dept}
                            onSelect={setSelectedDept}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DepartmentSection;
