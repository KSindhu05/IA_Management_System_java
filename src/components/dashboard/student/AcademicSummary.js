import React from 'react';
import { TrendingUp, BookOpen, AlertCircle, Award, CheckCircle } from 'lucide-react';
import styles from '../../../pages/StudentDashboard.module.css';

const AcademicSummary = ({ studentInfo, riskLevel, cieStatus = '0/5' }) => {
    // Determine risk color and label
    const riskColor = riskLevel === 'High' ? 'var(--danger)' : riskLevel === 'Moderate' ? 'var(--warning)' : 'var(--success)';
    const riskLabel = riskLevel || 'Low';

    return (
        <div className={styles.summaryGrid}>
            {/* CGPA Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }}>
                    <TrendingUp size={24} />
                </div>
                <div className={styles.summaryInfo}>
                    <span className={styles.summaryLabel}>Aggregate %</span>
                    <h3 className={styles.summaryValue}>{studentInfo.cgpa || '0'}%</h3>
                    <span className={styles.summarySubtext}>Current Sem</span>
                </div>
            </div>

            {/* Avg CIE Score */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                    <BookOpen size={24} />
                </div>
                <div className={styles.summaryInfo}>
                    <span className={styles.summaryLabel}>Avg CIE Score</span>
                    <h3 className={styles.summaryValue}>{studentInfo.avgCieScore || '0/25'}</h3>
                    <span className={styles.summarySubtext}>Current Sem</span>
                </div>
            </div>

            {/* CIE Progress */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                    <CheckCircle size={24} />
                </div>
                <div className={styles.summaryInfo}>
                    <span className={styles.summaryLabel}>CIE Progress</span>
                    <h3 className={styles.summaryValue}>{cieStatus}</h3>
                    <span className={styles.summarySubtext}>CIEs Completed</span>
                </div>
            </div>

            {/* Risk Level */}
            <div className={styles.summaryCard} style={{ borderLeft: `4px solid ${riskColor}` }}>
                <div className={styles.summaryIcon} style={{ background: `${riskColor}15`, color: riskColor }}>
                    <AlertCircle size={24} />
                </div>
                <div className={styles.summaryInfo}>
                    <span className={styles.summaryLabel}>Academic Status</span>
                    <h3 className={styles.summaryValue} style={{ color: riskColor }}>{riskLabel} Risk</h3>
                    <span className={styles.summarySubtext}>Based on Marks</span>
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const ClockIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export default AcademicSummary;
