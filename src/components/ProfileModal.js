import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { X, User, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import styles from './ProfileModal.module.css';

const ProfileModal = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Credential form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const canChangeUsername = user?.role === 'HOD' || user?.role === 'PRINCIPAL';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = user?.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`${API_BASE_URL}/profile`, { headers });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setNewUsername(data.username || '');
            }
        } catch (e) {
            console.error('Error fetching profile', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!currentPassword) {
            setMessage({ text: 'Current password is required', type: 'error' });
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }
        if (newPassword && newPassword.length < 4) {
            setMessage({ text: 'Password must be at least 4 characters', type: 'error' });
            return;
        }
        if (!newPassword && (!canChangeUsername || newUsername === profile?.username)) {
            setMessage({ text: 'No changes to save', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const token = user?.token;
            const body = { currentPassword };
            if (newPassword) body.newPassword = newPassword;
            if (canChangeUsername && newUsername !== profile?.username) body.newUsername = newUsername;

            const res = await fetch(`${API_BASE_URL}/profile/credentials`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: data.message || 'Credentials updated! Please re-login if you changed your username.', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ text: data.message || 'Update failed', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'PRINCIPAL': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
            case 'HOD': return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
            case 'FACULTY': return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <div className={styles.avatarLarge}>
                            {(profile?.fullName || user?.fullName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className={styles.headerName}>{profile?.fullName || user?.fullName || 'User'}</h2>
                            <span
                                className={styles.roleBadge}
                                style={{
                                    background: getRoleBadgeColor(profile?.role || user?.role).bg,
                                    color: getRoleBadgeColor(profile?.role || user?.role).color,
                                    border: `1px solid ${getRoleBadgeColor(profile?.role || user?.role).border}`
                                }}
                            >
                                <Shield size={12} /> {profile?.role || user?.role}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <User size={16} /> My Details
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'credentials' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('credentials')}
                    >
                        <Lock size={16} /> Change Credentials
                    </button>
                </div>

                {/* Tab Content */}
                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>Loading profile...</div>
                    ) : activeTab === 'details' ? (
                        <div className={styles.detailsGrid}>
                            <DetailRow label="Full Name" value={profile?.fullName} />
                            <DetailRow label="Username" value={profile?.username} />
                            <DetailRow label="Email" value={profile?.email} />
                            <DetailRow label="Designation" value={profile?.designation} />
                            <DetailRow label="Department" value={profile?.department} />
                            <DetailRow label="Role" value={profile?.role} />
                            {profile?.role === 'FACULTY' && (
                                <>
                                    <DetailRow label="Semester" value={profile?.semester} />
                                    <DetailRow label="Section" value={profile?.section} />
                                </>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSaveCredentials} className={styles.credForm}>
                            {message.text && (
                                <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>Current Password <span className={styles.required}>*</span></label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {canChangeUsername && (
                                <div className={styles.field}>
                                    <label>New Username</label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter new username"
                                    />
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>New Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Leave blank to keep current"
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPw(!showNewPw)}>
                                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {newPassword && (
                                <div className={styles.field}>
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.saveBtn} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className={styles.detailRow}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value || '—'}</span>
    </div>
);

export default ProfileModal;
