import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe, logout as apiLogout, logoutFromDirectory, logoutFromFinance, SSOCookieManager } from '../api/client';

const AuthContext = createContext(null);
const LOGOUT_FLAG_KEY = 'inventory_logout_in_progress';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (import.meta.env.VITE_DEV_MOCK_AUTH === 'true') {
            setUser({
                userId: import.meta.env.VITE_MOCK_USER_ID || '1',
                email: import.meta.env.VITE_MOCK_USER_EMAIL || 'dev@zenohosp.com',
                role: import.meta.env.VITE_MOCK_USER_ROLE || 'super_admin',
                hospitalId: import.meta.env.VITE_MOCK_HOSPITAL_ID || '1',
                modules: [],
            });
            setLoading(false);
            return;
        }
        const logoutInProgress = localStorage.getItem(LOGOUT_FLAG_KEY);
        if (logoutInProgress) {
            sessionStorage.removeItem('inventory_user');
            setUser(null);
            setLoading(false);
            localStorage.removeItem(LOGOUT_FLAG_KEY);
            return;
        }
        getMe()
            .then((res) => {
                const userData = res.data.data || res.data;
                sessionStorage.setItem('inventory_user', JSON.stringify(userData));
                setUser(userData);
            })
            .catch(() => {
                sessionStorage.removeItem('inventory_user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    // When the window/tab regains focus, verify session with backend.
    // This detects logouts performed in other apps (cross-subdomain) where
    // the server-side cookie may have been cleared.
    useEffect(() => {
        const verifyOnFocus = async () => {
            if (!user) return;
            if (import.meta.env.VITE_DEV_MOCK_AUTH === 'true') return;
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

    // Listen for cross-app logout signals (from other tabs/windows)
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'sso-logout') {
                // Another window/app initiated SSO logout
                sessionStorage.removeItem('inventory_user');
                setUser(null);
                SSOCookieManager.clearToken();
                window.location.href = '/login?logged_out=1';
            }
        };

        const handleCustomLogoutEvent = (event) => {
            // Handle custom logout event (same-tab communication)
            sessionStorage.removeItem('inventory_user');
            setUser(null);
            SSOCookieManager.clearToken();
            window.location.href = '/login?logged_out=1';
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('sso-logout', handleCustomLogoutEvent);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sso-logout', handleCustomLogoutEvent);
        };
    }, []);

    const logout = useCallback(async () => {
        console.log('🔴 Logout initiated');
        
        // Set logout flag FIRST
        localStorage.setItem(LOGOUT_FLAG_KEY, '1');
        
        // Clear local state immediately
        sessionStorage.removeItem('inventory_user');
        setUser(null);
        console.log('✅ Local state cleared');
        
        // Signal to other tabs/windows
        try {
            localStorage.setItem('sso-logout', `${Date.now()}`);
            window.dispatchEvent(new Event('sso-logout'));
            console.log('✅ Logout signal broadcast');
        } catch (e) {
            console.warn('Failed to broadcast logout:', e);
        }
        
        // Wait for all logout calls to settle — allSettled never short-circuits,
        // so the primary apiLogout() always completes even if finance/directory fail.
        await Promise.allSettled([
            apiLogout(),
            logoutFromDirectory(),
            logoutFromFinance()
        ]);
        
        // Force full page reload (NOT React Router navigation)
        console.log('🔄 Full page reload to login');
        window.location.href = '/login?logged_out=1';
    }, []);

    const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';
    const isHospitalAdmin = user?.role?.toLowerCase() === 'hospital_admin';
    const isDoctor = user?.role?.toLowerCase() === 'doctor';
    const isStaff = user?.role?.toLowerCase() === 'staff';

    // Get auth headers for API calls (cookie-based auth uses withCredentials)
    const getAuthHeaders = useCallback(() => {
        return {
            'Content-Type': 'application/json',
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isSuperAdmin,
                isHospitalAdmin,
                isDoctor,
                isStaff,
                logout,
                getAuthHeaders,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
