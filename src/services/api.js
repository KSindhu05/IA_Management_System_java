const API_BASE_URL = 'http://127.0.0.1:8084/api';

export const login = async (userId, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: userId, password }),
        });
        return await response.json();
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network Error' };
    }
};

export const fetchStudentDashboard = async (regNo) => {
    try {
        const response = await fetch(`${API_BASE_URL}/student/dashboard?regNo=${regNo}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        return await response.json();
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchHODDashboard = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/hod/dashboard`);
        if (!response.ok) throw new Error('Failed to fetch data');
        return await response.json();
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchPrincipalDashboard = async (token) => {
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/principal/dashboard`, { headers });
        if (!response.ok) throw new Error('Failed to fetch data');
        return await response.json();
    } catch (error) {
        console.error('Fetch dashboard error:', error);
        return null;
    }
};

export const fetchAllFaculty = async (token) => {
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/principal/faculty/all`, { headers });
        if (!response.ok) throw new Error('Failed to fetch faculty');
        return await response.json();
    } catch (error) {
        console.error('Fetch faculty error:', error);
        return [];
    }
};

export const fetchTimetables = async (token) => {
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/principal/timetables`, { headers });
        if (!response.ok) throw new Error('Failed to fetch timetables');
        return await response.json();
    } catch (error) {
        console.error('Fetch timetables error:', error);
        return [];
    }
};

export const fetchNotifications = async (token) => {
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/principal/notifications`, { headers });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return await response.json();
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return [];
    }
};

export const fetchReports = async (token) => {
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/principal/reports`, { headers });
        if (!response.ok) throw new Error('Failed to fetch reports');
        return await response.json();
    } catch (error) {
        console.error('Fetch reports error:', error);
        return [];
    }
};
