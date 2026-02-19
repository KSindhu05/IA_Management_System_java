import React from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Megaphone } from 'lucide-react';
import styles from './RightSidebar.module.css';

const RightSidebar = ({ notifications = [] }) => {

    // Helper for icons
    const getIcon = (type) => {
        switch (type) {
            case 'EXAM_SCHEDULE': // Mapped from backend
            case 'IA_ANNOUNCEMENT':
                return <Bell size={18} color="#2563eb" />;
            case 'MARKS_UPDATE':
            case 'MARKS_PUBLISHED':
                return <CheckCircle size={18} color="#16a34a" />;
            case 'ALERT':
            case 'MARKS_REJECTED':
                return <AlertCircle size={18} color="#dc2626" />;
            case 'BROADCAST':
                return <Megaphone size={18} color="#9333ea" />;
            default: return <Info size={18} color="#6b7280" />;
        }
    };

    return (
        <aside className={styles.container}>
            <div className={styles.header}>
                <h3>Announcements</h3>
                <span className={styles.count}>{notifications.filter(n => !n.isRead).length} New</span>
            </div>

            <div className={styles.list}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Bell size={32} color="#e5e7eb" />
                        <p>No new updates</p>
                    </div>
                ) : (
                    notifications.map((note) => (
                        <div key={note.id} className={`${styles.item} ${!note.isRead ? styles.unread : ''}`}>
                            <div className={styles.iconWrapper}>
                                {getIcon(note.type)}
                            </div>
                            <div className={styles.content}>
                                <p className={styles.message}>{note.message}</p>
                                <span className={styles.time}>
                                    {note.time || new Date(note.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;
