import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe, logout as apiLogout, logoutFromDirectory, SSOCookieManager } from '../api/client';

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
        console.log('🔴 Logout triggered');
        
        // Call both backends to clear HttpOnly cookies
        Promise.allSettled([
            apiLogout(),
            logoutFromDirectory(),
        ]).catch(err => {
            console.error('Logout API failed:', err);
        });
        
        // Clear local state immediately
        sessionStorage.removeItem('inventory_user');
        setUser(null);
        console.log('✅ User state cleared');
        
        // Signal logout across all tabs/windows and apps
        try {
            const signal = `logout-${Date.now()}`;
            localStorage.setItem('sso-logout', signal);
            console.log('✅ Logout signal broadcast');
        } catch (e) {
            console.warn('Failed to signal logout', e);
        }
        window.dispatchEvent(new Event('sso-logout'));
        
        // Redirect to login
        console.log('🔄 Redirecting to /login');
        setTimeout(() => {
            window.location.href = '/login?logged_out=1';
        }, 100);
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
