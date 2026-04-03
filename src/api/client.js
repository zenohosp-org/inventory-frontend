import axios from 'axios';
import SSOCookieManager from '../utils/ssoManager';

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8082';
export const DIRECTORY_API_URL = import.meta.env?.VITE_DIRECTORY_API_URL || 'http://localhost:9000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Automatically send/receive HTTPOnly cookies
});

// Response interceptor to handle 401/403 (session expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Redirect to SSO login on session expiry
            // But only if it's not the /api/user/me endpoint (bootstrapping session)
            if (!error.config.url.includes('/api/user/me')) {
                setTimeout(() => {
                    window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
                }, 500);
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth (Cookie-based) ──
export const getMe = () => api.get('/api/user/me');
export const logout = () => api.post('/api/auth/logout');

// ── Inventory  ──
export const getInventory = () => api.get('/api/inventory');
export const getInventoryById = (id) => api.get(`/api/inventory/${id}`);
export const createInventory = (data) => api.post('/api/inventory', data);
export const updateInventory = (id, data) => api.put(`/api/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/api/inventory/${id}`);

// ── Vendors ──
export const getVendors = () => api.get('/api/vendors');
export const getVendorById = (id) => api.get(`/api/vendors/${id}`);
export const createVendor = (data) => api.post('/api/vendors', data);
export const updateVendor = (id, data) => api.put(`/api/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/api/vendors/${id}`);

// ── Directory API (for fetching directory data) ──
export const getHospitals = () => axios.get(`${DIRECTORY_API_URL}/api/directory/hospitals`, { withCredentials: true });
export const getHospitalByCode = (code) => axios.get(`${DIRECTORY_API_URL}/api/directory/hospitals/${code}`, { withCredentials: true });

export { SSOCookieManager };
export default api;
