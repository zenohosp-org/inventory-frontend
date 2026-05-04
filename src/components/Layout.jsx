import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, History,
    LogOut, ChevronDown, ChevronRight, Layers, Store as StoreIcon,
    Menu as MenuIcon, X as XIcon, Globe, Inbox, FileText, Truck, Receipt, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [invOpen, setInvOpen] = useState(
        location.pathname === '/stock-overview' || location.pathname === '/stock-log'
    );
    const [purchaseOpen, setPurchaseOpen] = useState(
        ['/vendors', '/purchase-orders', '/po-bill'].includes(location.pathname)
    );
    const [productsOpen, setProductsOpen] = useState(
        ['/inventory-items', '/inventory-categories', '/item-types', '/inventory-kits'].includes(location.pathname)
    );

    const isAdmin = user?.role === 'hospital_admin' || user?.role === 'super_admin' || user?.role?.toLowerCase() === 'admin';

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`sidebar-link sidebar-submenu-link ${isActive(to) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="sidebar-icon" size={15} />
            {label}
        </Link>
    );

    const CollapseToggle = ({ open, onToggle, icon: Icon, label }) => (
        <button onClick={onToggle} className="sidebar-link sidebar-submenu-toggle">
            <div className="sidebar-submenu-inner">
                <Icon className="sidebar-icon" size={18} />
                {label}
            </div>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
    );

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="app-header">
                <div className="app-logo">
                    <Package size={22} />
                    <span>ZenoInventory</span>
                </div>
                <div className="header-right">
                    <div className="user-menu">
                        <span className="header-welcome">{user?.name || 'User'}</span>
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <Package size={20} className="sidebar-brand-icon" />
                    <span className="sidebar-brand-text">ZenoInventory</span>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {/* Dashboard */}
                        <li>
                            <Link
                                to="/dashboard"
                                className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="sidebar-icon" size={18} />
                                Dashboard
                            </Link>
                        </li>

                        {/* Inventory Section */}
                        <li className="sidebar-section">
                            <div className="sidebar-section-title">Inventory</div>

                            {/* Products collapsible */}
                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={productsOpen}
                                    onToggle={() => setProductsOpen(o => !o)}
                                    icon={Package}
                                    label="Products"
                                />
                                {productsOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/inventory-items" icon={Package} label="Items" />
                                        <NavLink to="/item-types" icon={Tag} label="Item Types" />
                                        <NavLink to="/inventory-categories" icon={Layers} label="Categories" />
                                        <NavLink to="/inventory-kits" icon={Package} label="Kits" />
                                    </div>
                                )}
                            </div>

                            {/* Inv collapsible */}
                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={invOpen}
                                    onToggle={() => setInvOpen(o => !o)}
                                    icon={Inbox}
                                    label="Inventory"
                                />
                                {invOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/stock-overview" icon={Inbox} label="Stock Overview" />
                                        <NavLink to="/stock-log" icon={History} label="Stock Log" />
                                    </div>
                                )}
                            </div>

                            {/* Purchase collapsible */}
                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={purchaseOpen}
                                    onToggle={() => setPurchaseOpen(o => !o)}
                                    icon={ShoppingCart}
                                    label="Purchase"
                                />
                                {purchaseOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/vendors" icon={Truck} label="Vendors" />
                                        <NavLink to="/purchase-orders" icon={FileText} label="Purchase Orders" />
                                        <NavLink to="/po-bill" icon={Receipt} label="PO Bills" />
                                    </div>
                                )}
                            </div>

                            {/* Stores — direct link */}
                            <Link
                                to="/stores"
                                className={`sidebar-link ${isActive('/stores') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <StoreIcon className="sidebar-icon" size={18} />
                                Stores
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    {isAdmin && (
                        <a
                            href="http://localhost:5173/dashboard"
                            className="btn btn-sm sidebar-footer-dir-btn"
                        >
                            <Globe size={14} />
                            Directory Admin
                        </a>
                    )}
                    <button onClick={logout} className="btn btn-sm sidebar-footer-signout">
                        <LogOut size={14} />
                        Sign Out
                    </button>
                    <div className="sidebar-copyright">© 2026 Inventory Manager</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
