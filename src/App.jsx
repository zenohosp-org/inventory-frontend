import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages — each becomes its own chunk, fetched only when the route is visited
const Login = lazy(() => import('./pages/Login'));
const SsoCallback = lazy(() => import('./pages/SsoCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockOverview = lazy(() => import('./pages/StockOverview'));

// Masters
const Stores = lazy(() => import('./pages/Stores'));
const Vendors = lazy(() => import('./pages/Vendors'));
const InventoryCategories = lazy(() => import('./pages/InventoryCategories'));
const InventoryItems = lazy(() => import('./features/inventory-items/InventoryItemsPage'));
const ItemTypes = lazy(() => import('./pages/ItemTypes'));
const InventoryKits = lazy(() => import('./features/inventory-kits/InventoryKitsPage'));
const PurchaseOrders = lazy(() => import('./features/purchase-orders/PurchaseOrdersPage'));
const StockLog = lazy(() => import('./pages/StockLog'));

// New pages
const POBill = lazy(() => import('./pages/POBill'));
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const GRN = lazy(() => import('./pages/GRN'));

function PageFallback() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            Loading…
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Suspense fallback={<PageFallback />}>
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
                    <Route path="/item-types" element={<ProtectedRoute><Layout><ItemTypes /></Layout></ProtectedRoute>} />
                    <Route path="/inventory-kits" element={<ProtectedRoute><Layout><InventoryKits /></Layout></ProtectedRoute>} />

                    {/* Operations */}
                    <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
                    <Route path="/stock-log" element={<ProtectedRoute><Layout><StockLog /></Layout></ProtectedRoute>} />
                    <Route path="/po-bill" element={<ProtectedRoute><Layout><POBill /></Layout></ProtectedRoute>} />
                    <Route path="/grn" element={<ProtectedRoute><Layout><GRN /></Layout></ProtectedRoute>} />

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Suspense>
        </Router>
    );
}
