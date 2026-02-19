import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import styles from '../../../pages/StudentDashboard.module.css';
import { useTheme } from '../../../context/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AcademicAnalytics = ({ realMarks }) => {
    const { isDarkMode } = useTheme();

    if (!realMarks || realMarks.length === 0) return null;

    // Process data for charts
    const subjects = realMarks.map(m => m.subject.code);
    const subjectNames = realMarks.map(m => m.subject.name.substring(0, 15) + (m.subject.name.length > 15 ? '...' : '')); // Truncate for display
    const cie1Scores = realMarks.map(m => m.cie1Score || 0);
    const cie2Scores = realMarks.map(m => m.cie2Score || 0);

    // Chart Configuration
    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: textColor }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 50,
                grid: { color: gridColor },
                ticks: { color: textColor }
            },
            x: {
                grid: { display: false },
                ticks: { color: textColor }
            }
        }
    };

    const performanceData = {
        labels: subjects,
        datasets: [
            {
                label: 'CIE-1 (Max 50)',
                data: cie1Scores,
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // Secondary Blue
                borderRadius: 4,
            },
            {
                label: 'CIE-2 (Max 50)',
                data: cie2Scores,
                backgroundColor: 'rgba(22, 163, 74, 0.7)', // Success Green
                borderRadius: 4,
            },
        ],
    };

    return (
        <div className={styles.analyticsGrid}>
            <div className={styles.chartCard} style={{ animationDelay: '0.2s', width: '100%', gridColumn: '1 / -1' }}>
                <h3 className={styles.cardTitle}>Performance Trend (CIE 1 vs CIE 2)</h3>
                <div style={{ height: '300px' }}>
                    <Bar options={options} data={performanceData} />
                </div>
            </div>
        </div>
    );
};

export default AcademicAnalytics;
