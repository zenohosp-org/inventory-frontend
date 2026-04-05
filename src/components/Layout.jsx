import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, History, Settings, 
  LogOut, ChevronDown, ChevronRight, Layers, Users, Store as StoreIcon, 
  Menu as MenuIcon, X as XIcon, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mastersOpen, setMastersOpen] = useState(
        location.pathname.startsWith('/vendors') ||
        location.pathname.startsWith('/inventory-items') ||
        location.pathname.startsWith('/inventory-categories') ||
        location.pathname.startsWith('/stores')
    );

    const isAdmin = user?.role === 'hospital_admin' || user?.role === 'super_admin' || user?.role?.toLowerCase() === 'admin';

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Stock Overview', path: '/stock-overview', icon: Package },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
        { label: 'Stock Log', path: '/stock-log', icon: History },
    ];

    const masterItems = [
        { label: 'Stores', path: '/stores', icon: StoreIcon },
        { label: 'Vendors', path: '/vendors', icon: Users },
        { label: 'Inventory Categories', path: '/inventory-categories', icon: Layers },
        { label: 'Inventory Items', path: '/inventory-items', icon: Package },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="app-layout">
            {/* Header */}
            <header className="app-header">
                <div className="app-logo">
                    <Package size={28} style={{ color: 'var(--color-primary)' }} />
                    <span>ZenoInventory</span>
                </div>

                <div className="header-right">
                    <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
                    </button>

                    <div className="user-menu">
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-gray-600)' }}>
                            Welcome, {user?.name || 'User'}
                        </span>
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.preventDefault(); logout(); }} title="Sign Out">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <ul className="sidebar-menu">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="sidebar-icon" size={20} />
                                {item.label}
                            </Link>
                        </li>
                    ))}

                    {/* Masters Section */}
                    <li style={{ marginTop: 'var(--spacing-6)' }}>
                        <div className="sidebar-section-title">Settings & Masters</div>
                        <button
                            onClick={() => setMastersOpen(!mastersOpen)}
                            className="sidebar-link"
                            style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                <Settings className="sidebar-icon" size={20} />
                                Masters
                            </div>
                            {mastersOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        {mastersOpen && (
                            <div style={{ marginLeft: 'var(--spacing-6)', borderLeft: '2px solid var(--color-gray-200)', paddingLeft: 'var(--spacing-2)' }}>
                                {masterItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                                        style={{ fontSize: 'var(--fs-sm)', paddingLeft: 'var(--spacing-4)' }}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className="sidebar-icon" size={18} />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </li>
                </ul>

                {/* Sidebar Footer */}
                <div style={{ marginTop: 'auto', padding: 'var(--spacing-4)', borderTop: '1px solid var(--color-gray-200)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    {isAdmin && (
                        <a
                            href="http://localhost:5173/dashboard"
                            className="btn btn-sm"
                            style={{
                                backgroundColor: '#EBF4FF',
                                color: 'var(--color-primary)',
                                border: '1px solid #BFD9F6',
                                justifyContent: 'center'
                            }}
                        >
                            <Globe size={16} />
                            Directory Admin
                        </a>
                    )}
                    <button
                        onClick={(e) => { e.preventDefault(); logout(); }}
                        className="btn btn-sm btn-danger"
                        style={{ justifyContent: 'center' }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                    <div style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--color-gray-400)',
                        textAlign: 'center',
                        fontWeight: 'var(--fw-semibold)',
                        letterSpacing: '0.5px',
                        marginTop: 'var(--spacing-4)'
                    }}>
                        © 2026 Inventory Manager
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
