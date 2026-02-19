import React, { memo } from 'react';
import { Users, GraduationCap, TrendingUp, ShieldCheck, ArrowUpRight, Activity, BookOpen } from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import styles from '../../../pages/PrincipalDashboard.module.css';
// import { collegeStats, principalStats, academicTrends } from '../../../utils/mockData'; // Removed static mock imports
import {
    PendingApprovalsWidget, FocusListWidget,
    YearComparisonWidget, NotesWidget, FacultyPerformanceWidget, ScheduleWidget, ActionCenter, CIEStatsWidget, LowPerformersWidget
} from './Widgets';

// Premium Hero Card Component
const HeroStatCard = ({ label, value, icon: Icon, color, trend, gradient, customContent, onClick }) => (
    <div style={{
        background: gradient || 'white',
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '160px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
    }}
        onClick={onClick}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(0,0,0,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0,0,0,0.05)'; }}
    >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', borderRadius: '50%', background: color, opacity: 0.1, filter: 'blur(30px)' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative', zIndex: 1, height: '100%' }}>
            {customContent ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ background: 'white', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: 'fit-content', marginBottom: '1rem' }}>
                            <Icon size={24} color={color} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>{label}</p>
                    </div>
                    <div style={{ width: '100px', height: '100px' }}>
                        {customContent}
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                        <div style={{ background: 'white', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: 'fit-content' }}>
                            <Icon size={24} color={color} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>{label}</p>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '2.4rem', color: '#1e293b', fontWeight: 800, letterSpacing: '-1px' }}>{value}</h3>
                        </div>
                    </div>
                    {trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
                            <TrendingUp size={14} /> {trend}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
);

const OverviewSection = memo(({
    stats, chartData, branches, branchPerformance, lowPerformers,
    facultyAnalytics, schedule, approvals, cieStats, trends, hodSubmissionStatus, onNavigate
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.6s ease-out' }}>

        {/* --- HERO STATS (FLOWCHART: OVERVIEW PANEL) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <HeroStatCard
                label="Total Students"
                value={stats?.totalStudents || 0}
                icon={Users}
                color="#3b82f6"
                trend="+5%"
                gradient="linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
                onClick={() => onNavigate && onNavigate('directory')}
            />
            <HeroStatCard
                label="Total Faculty"
                value={stats?.totalFaculty || "Loading..."}
                icon={Users}
                color="#8b5cf6"
                trend="Stable"
                gradient="linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)"
                onClick={() => onNavigate && onNavigate('faculty')}
            />
            <HeroStatCard
                label="Departments"
                value={branches?.length || 0}
                icon={BookOpen}
                color="#f59e0b"
                trend="Active"
                gradient="linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)"
                onClick={() => onNavigate && onNavigate('departments')}
            />
            <HeroStatCard
                label="CIE Status"
                icon={Activity}
                color="#10b981"
                gradient="linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)"
                customContent={<CIEStatsWidget {...cieStats} />}
                onClick={() => onNavigate && onNavigate('compliance')}
            />
        </div>

        {/* --- MAIN CONTENT GRID (Asymmetrical) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* LEFT COLUMN (Student Performance & Faculty Monitoring) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Academic Performance Chart (FLOWCHART: STUDENT PERFORMANCE) */}
                <div className={styles.glassCard} style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b', fontWeight: 700 }}>Department Performance</h3>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Average CIE Scores Comparison</p>
                        </div>
                        <button className={styles.secondaryBtn} onClick={() => alert('Viewing Full Analysis')}>
                            View Details <ArrowUpRight size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', justifyContent: 'center', padding: '1rem 0' }}>
                        {branches?.map((dept, index) => {
                            const score = branchPerformance?.[index] || 0;
                            const color = chartData?.datasets?.[0]?.backgroundColor?.[index] || '#cbd5e1';
                            const doughnutData = {
                                labels: ['Score', 'Note'],
                                datasets: [{
                                    data: [score, 100 - score],
                                    backgroundColor: [color, '#f1f5f9'],
                                    borderWidth: 0,
                                    cutout: '82%',
                                    borderRadius: 40,
                                }]
                            };
                            return (
                                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '130px', transition: 'transform 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ height: '130px', width: '130px', position: 'relative' }}>
                                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '82%', plugins: { tooltip: { enabled: false }, legend: { display: false } } }} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <span style={{ fontWeight: '800', fontSize: '1.6rem', color: '#1e293b', lineHeight: 1 }}>{score}%</span>
                                        </div>
                                    </div>
                                    <span style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>{dept}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Trend & Faculty Rows (FLOWCHART: FACULTY MONITORING) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <FacultyPerformanceWidget analytics={facultyAnalytics} />
                    <ScheduleWidget schedule={schedule} />
                </div>
                <LowPerformersWidget data={lowPerformers} />
            </div>

            {/* RIGHT COLUMN (Action Center & Approvals) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <ActionCenter />
                {/* FLOWCHART: PENDING CIE APPROVALS */}
                <PendingApprovalsWidget approvals={approvals} />
                <FocusListWidget branches={branches} branchPerformance={branchPerformance} hodSubmissionStatus={hodSubmissionStatus} />
                <YearComparisonWidget trends={trends} />
            </div>
        </div>

    </div>
));

export default OverviewSection;
