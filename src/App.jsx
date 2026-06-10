import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PageSkeleton from './components/PageSkeleton';

// Lazy-loaded pages — each becomes its own chunk, fetched only when the route is visited
const Login = lazy(() => import('./pages/Login'));
const SsoCallback = lazy(() => import('./pages/SsoCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StockOverview = lazy(() => import('./pages/StockOverview'));

// Masters
const Stores = lazy(() => import('./features/stores/StoresPage'));
const Vendors = lazy(() => import('./features/vendors/VendorsPage'));
const InventoryCategories = lazy(() => import('./pages/InventoryCategories'));
const InventoryItems = lazy(() => import('./features/inventory-items/InventoryItemsPage'));
const ItemTypes = lazy(() => import('./pages/ItemTypes'));
const InventoryKits = lazy(() => import('./features/inventory-kits/InventoryKitsPage'));
const PurchaseOrders = lazy(() => import('./features/purchase-orders/PurchaseOrdersPage'));
const Contracts = lazy(() => import('./features/contracts/ContractsPage'));
const StockLog = lazy(() => import('./pages/StockLog'));

// New pages
const POBill = lazy(() => import('./pages/POBill'));
const StoreDetail = lazy(() => import('./pages/StoreDetail'));
const GRN = lazy(() => import('./pages/GRN'));

/**
 * Wraps a lazy-loaded page with the Layout (sidebar + header) plus an inner
 * Suspense boundary. The Layout chrome stays visible while the page chunk
 * downloads — only the content area falls back to <PageSkeleton/>.
 */
function PageShell({ children }) {
    return (
        <ProtectedRoute>
            <Layout>
                <Suspense fallback={<PageSkeleton />}>
                    {children}
                </Suspense>
            </Layout>
        </ProtectedRoute>
    );
}

function FullScreenFallback() {
    return (
        <div className="app-loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            Loading…
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Full-screen pages (no sidebar) — keep an outer Suspense for them */}
                <Route path="/login" element={
                    <Suspense fallback={<FullScreenFallback />}><Login /></Suspense>
                } />
                <Route path="/sso/callback" element={
                    <Suspense fallback={<FullScreenFallback />}><SsoCallback /></Suspense>
                } />

                {/* App pages (with sidebar layout, protected).
                    Suspense lives INSIDE PageShell — sidebar/header stay visible
                    while the page chunk downloads. */}
                <Route path="/dashboard" element={<PageShell><Dashboard /></PageShell>} />
                <Route path="/stock-overview" element={<PageShell><StockOverview /></PageShell>} />

                {/* Masters */}
                <Route path="/stores" element={<PageShell><Stores /></PageShell>} />
                <Route path="/stores/:storeId" element={<PageShell><StoreDetail /></PageShell>} />
                <Route path="/vendors" element={<PageShell><Vendors /></PageShell>} />
                <Route path="/contracts" element={<PageShell><Contracts /></PageShell>} />
                <Route path="/inventory-categories" element={<PageShell><InventoryCategories /></PageShell>} />
                <Route path="/inventory-items" element={<PageShell><InventoryItems /></PageShell>} />
                <Route path="/item-types" element={<PageShell><ItemTypes /></PageShell>} />
                <Route path="/inventory-kits" element={<PageShell><InventoryKits /></PageShell>} />

                {/* Operations */}
                <Route path="/purchase-orders" element={<PageShell><PurchaseOrders /></PageShell>} />
                <Route path="/stock-log" element={<PageShell><StockLog /></PageShell>} />
                <Route path="/po-bill" element={<PageShell><POBill /></PageShell>} />
                <Route path="/grn" element={<PageShell><GRN /></PageShell>} />

                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}
