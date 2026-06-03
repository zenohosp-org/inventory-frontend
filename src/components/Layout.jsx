import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, History,
    ChevronDown, ChevronRight, Layers, Store as StoreIcon,
    Globe, Inbox, FileText, Truck, Receipt, Tag,
    Activity, BarChart2, Box, ArrowUpRight, ClipboardList
} from 'lucide-react';
import Header from './Header';

export default function Layout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [invOpen, setInvOpen] = useState(
        location.pathname === '/stock-overview' || location.pathname === '/stock-log'
    );
    const [purchaseOpen, setPurchaseOpen] = useState(
        ['/vendors', '/purchase-orders', '/po-bill', '/grn'].includes(location.pathname)
    );
    const [productsOpen, setProductsOpen] = useState(
        ['/inventory-items', '/inventory-categories', '/item-types', '/inventory-kits'].includes(location.pathname)
    );

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
                                        <NavLink to="/grn" icon={ClipboardList} label="GRN" />
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

                        {/* Other Apps */}
                        <li className="sidebar-section sidebar-apps-section">
                            <div className="sidebar-section-title">Other Apps</div>
                            {[
                                { label: 'HMS', href: 'https://hms.zenohosp.com', icon: Activity },
                                { label: 'Finance', href: 'https://finance.zenohosp.com', icon: BarChart2 },
                                { label: 'Assets', href: 'https://asset.zenohosp.com', icon: Box },
                                { label: 'Directory', href: 'https://directory.zenohosp.com', icon: Globe },
                            ].map(({ label, href, icon: Icon }) => (
                                <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sidebar-link"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="sidebar-icon" size={18} />
                                    {label}
                                    <ArrowUpRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                                </a>
                            ))}
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-copyright">© 2026 Inventory Manager</div>
                </div>
            </aside>

            {/* Header + Main */}
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header />
                <main className="main-content" style={{ flex: 1, gridColumn: 'unset', gridRow: 'unset' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
