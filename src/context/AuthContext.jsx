import { createContext, useContext, useState, useEffect } from 'react';
import api, { getMyProfile } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('asset_jwt');
        if (token) {
            getMyProfile()
                .then((res) => setUser(res.data.data))
                .catch(() => localStorage.removeItem('asset_jwt'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        const { token, user: userData } = res.data.data;
        localStorage.setItem('asset_jwt', token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('asset_jwt');
        setUser(null);
    };

    const ssoLogin = (token) => {
        localStorage.setItem('asset_jwt', token);
        return getMyProfile().then(res => {
            setUser(res.data.data);
            return res.data.data;
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, ssoLogin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
