import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import StockOverview from './pages/StockOverview';
import Login from './pages/Login';
import SsoCallback from './pages/SsoCallback';

// Masters
import Stores from './pages/Stores';
import Vendors from './pages/Vendors';
import InventoryCategories from './pages/InventoryCategories';
import InventoryItems from './pages/InventoryItems';
import PurchaseOrders from './pages/PurchaseOrders';
import StockLog from './pages/StockLog';

// New pages
import POBill from './pages/POBill';
import StoreDetail from './pages/StoreDetail';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Full-screen pages (no sidebar) */}
                <Route path="/login" element={<Login />} />
                <Route path="/sso/callback" element={<SsoCallback />} />

                {/* App pages (with sidebar layout, protected) */}
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/stock-overview" element={<ProtectedRoute><Layout><StockOverview /></Layout></ProtectedRoute>} />

                {/* Masters */}
                <Route path="/stores" element={<ProtectedRoute><Layout><Stores /></Layout></ProtectedRoute>} />
                <Route path="/stores/:storeId" element={<ProtectedRoute><Layout><StoreDetail /></Layout></ProtectedRoute>} />
                <Route path="/vendors" element={<ProtectedRoute><Layout><Vendors /></Layout></ProtectedRoute>} />
                <Route path="/inventory-categories" element={<ProtectedRoute><Layout><InventoryCategories /></Layout></ProtectedRoute>} />
                <Route path="/inventory-items" element={<ProtectedRoute><Layout><InventoryItems /></Layout></ProtectedRoute>} />

                {/* Operations */}
                <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
                <Route path="/stock-log" element={<ProtectedRoute><Layout><StockLog /></Layout></ProtectedRoute>} />
                <Route path="/po-bill" element={<ProtectedRoute><Layout><POBill /></Layout></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}
