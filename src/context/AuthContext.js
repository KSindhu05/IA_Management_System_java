import React, { createContext, useState, useContext, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // MOCK MODE - Set to true to work without backend
        const USE_MOCK = false;

        if (USE_MOCK) {
            // Mock login for frontend development
            const mockUsers = {
                'principal': { role: 'principal', name: 'Principal Admin' },
                'hod_cs': { role: 'hod', name: 'HOD - CS Department' },
                'faculty_cs': { role: 'faculty', name: 'Faculty - CS' },
                'faculty_maths': { role: 'faculty', name: 'Faculty - Maths' },
                '459CS23001': { role: 'student', name: 'A KAVITHA' },
                '459CS23002': { role: 'student', name: 'ABHISHEKA' },
                '459CS23003': { role: 'student', name: 'ADARSH REDDY G' },
                '459CS23004': { role: 'student', name: 'AGASARA KEERTHANA' },
                '459CS23005': { role: 'student', name: 'AKHIL S' }
            };

            const mockUser = mockUsers[username];
            if (mockUser) {
                const userData = {
                    id: username,
                    role: mockUser.role,
                    name: mockUser.name,
                    token: 'mock-token-' + username
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true, role: userData.role };
            } else {
                return { success: false, message: 'Invalid credentials (Mock Mode)' };
            }
        }

        // REAL API MODE
        try {
            console.log("Sending login request to backend...");
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            console.log("Response status:", response.status);

            console.log("Response status:", response.status);

            let data;
            try {
                data = await response.json();
                console.log("Response data:", data);
            } catch (err) {
                console.warn("Server returned non-JSON response:", err);
                // If parsing fails, use a default object or handle as text if needed
                data = { message: "Authentication failure (Server Error)" };
            }

            if (response.ok) {
                // Backend returns: { token, id, username, role, department, fullName }
                const userData = {
                    id: data.username, // Using username as the ID for frontend logic
                    username: data.username,
                    role: data.role.toLowerCase(), // Frontend expects lowercase roles
                    name: data.username,
                    fullName: data.fullName || data.username, // Use fullName if available
                    department: data.department, // Store department from backend
                    token: data.token
                };

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true, role: userData.role };
            } else {
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: 'Network error: ' + error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
