// HOD Dashboard - Unlock Marks Component
// Add this component to HODDashboard.js where needed

// Simple Unlock Panel to add to HOD Dashboard
const UnlockMarksPanel = () => {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedCIE, setSelectedCIE] = useState('CIE1');

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3>🔓 Unlock Approved Marks</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Unlock approved marks to allow faculty to make corrections
                </p>
            </div>
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label>
                        <select
                            className={styles.select}
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem' }}
                        >
                            <option value="">Select Subject</option>
                            {subjects.filter(s => s.name !== 'IC').map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name} - {subject.instructorName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>CIE Type</label>
                        <select
                            className={styles.select}
                            value={selectedCIE}
                            onChange={(e) => setSelectedCIE(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem' }}
                        >
                            <option value="CIE1">CIE-1</option>
                            <option value="CIE2">CIE-2</option>
                            <option value="CIE3">CIE-3</option>
                            <option value="CIE4">CIE-4</option>
                            <option value="CIE5">CIE-5</option>
                        </select>
                    </div>

                    <button
                        className={styles.dangerBtn}
                        onClick={() => {
                            if (!selectedSubject) {
                                alert('Please select a subject');
                                return;
                            }
                            const subject = subjects.find(s => s.id === parseInt(selectedSubject));
                            handleUnlockMarks(selectedSubject, selectedCIE, subject?.name || 'Selected Subject');
                        }}
                        disabled={!selectedSubject}
                        style={{ padding: '0.6rem 1.5rem' }}
                    >
                        Unlock Marks
                    </button>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                    <strong>⚠️ Warning:</strong> Unlocking marks will change their status from APPROVED to PENDING, allowing faculty to edit them again.
                </div>
            </div>
        </div>
    );
};

// Instructions:
// 1. Add this component definition inside the HODDashboard function, before the return statement
// 2. Add <UnlockMarksPanel /> in the monitoring tab section or as a new tab
// 3. Make sure to import useState if not already imported
