import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe, logout as apiLogout } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = sessionStorage.getItem('inventory_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(!user); // if user exists, don't need to load

    // Restore session from backend on mount (cookie-based auth)
    useEffect(() => {
        if (!user && loading) {
            getMe()
                .then((res) => {
                    const userData = res.data.data || res.data;
                    sessionStorage.setItem('inventory_user', JSON.stringify(userData));
                    setUser(userData);
                })
                .catch(() => {
                    // No valid session/cookie
                    sessionStorage.removeItem('inventory_user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // When the window/tab regains focus, verify session with backend.
    // This detects logouts performed in other apps (cross-subdomain) where
    // the server-side cookie may have been cleared.
    useEffect(() => {
        const verifyOnFocus = async () => {
            if (!user) return;
            try {
                await getMe();
                // still valid — nothing to do
            } catch (err) {
                // Session invalidated on server; clear local state and redirect to login
                sessionStorage.removeItem('inventory_user');
                setUser(null);
                window.location.href = '/login?logged_out=1';
            }
        };

        window.addEventListener('focus', verifyOnFocus);
        return () => window.removeEventListener('focus', verifyOnFocus);
    }, [user]);

    const doLogout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (error) {
            // Continue logout even if API call fails
            console.error('Logout API failed:', error);
        }
        sessionStorage.removeItem('inventory_user');
        setUser(null);
        // Redirect to login
        window.location.href = '/login?logged_out=1';
    }, []);

    const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';
    const isHospitalAdmin = user?.role?.toLowerCase() === 'hospital_admin';
    const isDoctor = user?.role?.toLowerCase() === 'doctor';
    const isStaff = user?.role?.toLowerCase() === 'staff';

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isSuperAdmin,
                isHospitalAdmin,
                isDoctor,
                isStaff,
                doLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
