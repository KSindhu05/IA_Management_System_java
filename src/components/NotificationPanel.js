import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import styles from './NotificationPanel.module.css';

const NotificationPanel = ({ onClose }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = `${API_BASE_URL}/notifications`;

    useEffect(() => {
        fetchNotifications();
        // Short polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(API_BASE, { headers });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            await fetch(`${API_BASE}/${id}/read`, { method: 'POST', headers });

            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'IA_ANNOUNCEMENT': return <Bell size={18} color="#2563eb" />;
            case 'MARKS_PUBLISHED': return <CheckCircle size={18} color="#16a34a" />;
            case 'MARKS_REJECTED': return <AlertCircle size={18} color="#dc2626" />;
            case 'BROADCAST': return <Megaphone size={18} color="#9333ea" />;
            default: return <Info size={18} color="#6b7280" />;
        }
    };

    // Helper for Megaphone icon if not imported
    const Megaphone = ({ size, color }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
    );

    return (
        <div className={styles.panelOverlay}>
            <div className={styles.panel}>
                <div className={styles.header}>
                    <h3>Notifications</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <Bell size={40} color="#e5e7eb" />
                            <p>No new notifications</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {notifications.map(note => (
                                <div
                                    key={note.id}
                                    className={`${styles.item} ${note.isRead ? styles.read : styles.unread}`}
                                    onClick={() => !note.isRead && markAsRead(note.id)}
                                >
                                    <div className={styles.iconWrapper}>
                                        {getIcon(note.type)}
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.titleRow}>
                                            <h4>{note.title}</h4>
                                            <span className={styles.time}>
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p>{note.message}</p>
                                    </div>
                                    {!note.isRead && <div className={styles.dot}></div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
