import axios from 'axios';
import SSOCookieManager from '../utils/ssoManager';

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api-inventory.zenohosp.com';
export const DIRECTORY_API_URL = import.meta.env?.VITE_DIRECTORY_API_URL || 'http://localhost:9000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  // Automatically send/receive HTTPOnly cookies
});

// Response transformer to handle stringified JSON responses
api.defaults.transformResponse = [
    function(data) {
        // Try to parse JSON if data is a string
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.warn('Could not parse response as JSON, returning as-is');
                return data;
            }
        }
        return data;
    }
];

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

// Inject real JWT on all requests when mock auth is enabled (local dev only)
if (import.meta.env.VITE_DEV_MOCK_AUTH === 'true' && import.meta.env.VITE_MOCK_JWT) {
    api.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${import.meta.env.VITE_MOCK_JWT}`;
        return config;
    });
}

// ── Auth (Cookie-based) ──
export const getMe = () => api.get('/api/user/me');
export const logout = () => api.post('/api/auth/logout');
export const logoutFromDirectory = () => axios.post(`${DIRECTORY_API_URL}/api/auth/logout`, {}, {
    withCredentials: true,
});

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

// ── Categories ──
export const getCategories = () => api.get('/api/inventory/categories');
export const getCategoryById = (id) => api.get(`/api/inventory/categories/${id}`);
export const createCategory = (data) => api.post('/api/inventory/categories', data);
export const updateCategory = (id, data) => api.put(`/api/inventory/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/api/inventory/categories/${id}`);

// ── Stores ──
export const getStores = () => api.get('/api/inventory/stores');
export const getStoreById = (id) => api.get(`/api/inventory/stores/${id}`);
export const createStore = (data) => api.post('/api/inventory/stores', data);
export const updateStore = (id, data) => api.put(`/api/inventory/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/api/inventory/stores/${id}`);

// ── Items ──
export const getItems = () => api.get('/api/inventory/items');
export const getItemById = (id) => api.get(`/api/inventory/items/${id}`);
export const createItem = (data) => api.post('/api/inventory/items', data);
export const updateItem = (id, data) => api.put(`/api/inventory/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/api/inventory/items/${id}`);

// ── Stock Overview ──
export const getStockOverview = () => api.get('/api/inventory/stock-overview');

// ── Stock Transactions ──
export const getStockLogs = (params) => api.get('/api/inventory/stock-transactions', { params });
export const logStock = (data) => api.post('/api/inventory/log-stock', data);

// ── Purchase Orders ──
export const getPurchaseOrders = () => api.get('/api/inventory/purchase-orders');
export const getPurchaseOrderById = (id) => api.get(`/api/inventory/purchase-orders/${id}`);
export const createPurchaseOrder = (data) => api.post('/api/inventory/purchase-orders', data);
export const updatePurchaseOrder = (id, data) => api.put(`/api/inventory/purchase-orders/${id}`, data);
export const deletePurchaseOrder = (id) => api.delete(`/api/inventory/purchase-orders/${id}`);

// ── PO Receipt Workflow ──
export const recordPOReceipt = (poId, items) =>
    api.post(`/api/inventory/po/${poId}/record-receipt`, { items });

export const convertPOToBill = (poId) =>
    api.post(`/api/inventory/po/${poId}/convert-to-bill`);

export const updatePOBillPaymentStatus = (billId, paymentStatus, paidAmount) =>
    api.put(`/api/po-bills/${billId}/payment-status`, { paymentStatus, paidAmount });

export const getPOsByStore = (storeId, onlyOpen) =>
    api.get(`/api/inventory/stores/${storeId}/po`, { params: { onlyOpen } });

export const getStockOverviewWithPOs = () =>
    api.get('/api/inventory/stock-overview-with-po');

// ── PO Bills ──
export const getPOBills = (params) => api.get('/api/po-bills', { params });
export const getPOBillById = (billId) => api.get(`/api/po-bills/${billId}`);


// ── Directory API (for fetching directory data) ──
export const getHospitals = () => axios.get(`${DIRECTORY_API_URL}/api/directory/hospitals`, { withCredentials: true });
export const getHospitalByCode = (code) => axios.get(`${DIRECTORY_API_URL}/api/directory/hospitals/${code}`, { withCredentials: true });

export { SSOCookieManager };
export default api;
