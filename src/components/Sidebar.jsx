import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, History,
    ChevronDown, Layers, Store as StoreIcon,
    Globe, Inbox, FileText, Truck, Receipt, Tag,
    Activity, BarChart2, Box, ArrowUpRight, ClipboardList, Settings, FileCheck,
    Stethoscope, FlaskConical, Pill
} from 'lucide-react';

export default function Sidebar({ isOpen, onToggle }) {
    const location = useLocation();

    const [invOpen, setInvOpen] = useState(
        location.pathname === '/stock-overview' || location.pathname === '/stock-log'
    );
    const [purchaseOpen, setPurchaseOpen] = useState(
        ['/vendors', '/purchase-orders', '/po-bill', '/grn', '/contracts'].includes(location.pathname)
    );
    const [settingsOpen, setSettingsOpen] = useState(
        ['/item-types', '/inventory-categories', '/vendors', '/stores'].includes(location.pathname)
    );

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavLink = ({ to, label }) => (
        <li>
            <Link
                to={to}
                className={isActive(to) ? 'active' : ''}
            >
                {label}
            </Link>
        </li>
    );

    const CollapseToggle = ({ open, onToggle, icon: Icon, label }) => (
        <button onClick={onToggle} className="sidebar-nav-item" style={{ width: '100%', margin: '0' }}>
            <div className="sidebar-nav-label">
                <Icon className="sidebar-nav-icon" size={18} />
                <span>{label}</span>
            </div>
            <ChevronDown className={`sidebar-nav-chevron ${open ? 'is-open' : ''}`} />
        </button>
    );

    return (
        <aside className={`sidebar ${!isOpen ? 'is-collapsed' : ''}`}>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Package size={20} />
                </div>
                {isOpen && (
                    <div className="sidebar-brand">
                        <h2 className="sidebar-brand-name">ZenoInventory</h2>
                    </div>
                )}
            </div>

            <div className="sidebar-nav-container">
                
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-group">
                        <Link
                            to="/dashboard"
                            className={`sidebar-nav-item ${isActive('/dashboard') ? 'active' : ''} ${!isOpen ? 'is-icon-only' : ''}`}
                            title={!isOpen ? "Dashboard" : ""}
                        >
                            <div className="sidebar-nav-label">
                                <LayoutDashboard className="sidebar-nav-icon" />
                                {isOpen && <span>Dashboard</span>}
                            </div>
                        </Link>
                    </div>
                </nav>
                
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-group">
                        <Link
                            to="/inventory-items"
                            className={`sidebar-nav-item ${isActive('/inventory-items') ? 'active' : ''} ${!isOpen ? 'is-icon-only' : ''}`}
                            title={!isOpen ? "Items" : ""}
                        >
                            <div className="sidebar-nav-label">
                                <Package className="sidebar-nav-icon" />
                                {isOpen && <span>Items</span>}
                            </div>
                        </Link>
                    </div>
                    
                    <div className="sidebar-nav-group">
                        {isOpen ? (
                            <>
                                <CollapseToggle
                                    open={purchaseOpen}
                                    onToggle={() => setPurchaseOpen(o => !o)}
                                    icon={ShoppingCart}
                                    label="Purchase"
                                />
                                {purchaseOpen && (
                                    <ul className="sidebar-submenu">
                                        <NavLink to="/purchase-orders" label="Purchase Orders" />
                                        <NavLink to="/grn" label="GRN" />
                                        <NavLink to="/po-bill" label="PO Bills" />
                                        <NavLink to="/purchase-returns" label="Purchase Returns" />
                                        <NavLink to="/delivery-challans" label="Delivery Challans" />
                                        <NavLink to="/contracts" label="Contracts (AMC/CMC)" />
                                    </ul>
                                )}
                            </>
                        ) : (
                            <Link
                                to="/purchase-orders"
                                className={`sidebar-nav-item is-icon-only ${isActive('/purchase-orders') ? 'active' : ''}`}
                                title="Purchase"
                            >
                                <ShoppingCart className="sidebar-nav-icon" />
                            </Link>
                        )}
                    </div>
                    
                    <div className="sidebar-nav-group">
                        {isOpen ? (
                            <>
                                <CollapseToggle
                                    open={invOpen}
                                    onToggle={() => setInvOpen(o => !o)}
                                    icon={Inbox}
                                    label="Stock"
                                />
                                {invOpen && (
                                    <ul className="sidebar-submenu">
                                        <NavLink to="/stock-overview" label="Stock Overview" />
                                        <NavLink to="/stock-log" label="Stock Log" />
                                    </ul>
                                )}
                            </>
                        ) : (
                            <Link
                                to="/stock-overview"
                                className={`sidebar-nav-item is-icon-only ${isActive('/stock-overview') ? 'active' : ''}`}
                                title="Stock"
                            >
                                <Inbox className="sidebar-nav-icon" />
                            </Link>
                        )}
                    </div>
                    
                    <div className="sidebar-nav-group">
                        <Link
                            to="/inventory-kits"
                            className={`sidebar-nav-item ${isActive('/inventory-kits') ? 'active' : ''} ${!isOpen ? 'is-icon-only' : ''}`}
                            title={!isOpen ? "Kits" : ""}
                        >
                            <div className="sidebar-nav-label">
                                <Layers className="sidebar-nav-icon" />
                                {isOpen && <span>Kits</span>}
                            </div>
                        </Link>
                    </div>

                    <div className="sidebar-nav-group">
                        <Link
                            to="/reports"
                            className={`sidebar-nav-item ${isActive('/reports') ? 'active' : ''} ${!isOpen ? 'is-icon-only' : ''}`}
                            title={!isOpen ? "Reports" : ""}
                        >
                            <div className="sidebar-nav-label">
                                <FileText className="sidebar-nav-icon" />
                                {isOpen && <span>Reports</span>}
                            </div>
                        </Link>
                    </div>
                </nav>
                
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-group">
                        {isOpen ? (
                            <>
                                <CollapseToggle
                                    open={settingsOpen}
                                    onToggle={() => setSettingsOpen(o => !o)}
                                    icon={Settings}
                                    label="Settings"
                                />
                                {settingsOpen && (
                                    <ul className="sidebar-submenu">
                                        <NavLink to="/item-types" label="Item Types" />
                                        <NavLink to="/inventory-categories" label="Categories" />
                                        <NavLink to="/vendors" label="Vendors" />
                                        <NavLink to="/stores" label="Stores" />
                                    </ul>
                                )}
                            </>
                        ) : (
                            <Link
                                to="/item-types"
                                className={`sidebar-nav-item is-icon-only ${isActive('/item-types') ? 'active' : ''}`}
                                title="Settings"
                            >
                                <Settings className="sidebar-nav-icon" />
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
            
            <div className="sidebar-footer">
                {isOpen && <h3 className="sidebar-section-label" style={{ padding: '8px 12px 4px', fontSize: '10px' }}>Other Apps</h3>}
                {[
                    { label: 'HMS', href: 'https://hms.zenohosp.com', icon: Activity },
                    { label: 'OT Room', href: 'https://ot.zenohosp.com', icon: Stethoscope },
                    { label: 'Lab', href: 'https://lab.zenohosp.com', icon: FlaskConical },
                    { label: 'Pharmacy', href: 'https://pharmacy.zenohosp.com', icon: Pill },
                    { label: 'Finance', href: 'https://finance.zenohosp.com', icon: BarChart2 },
                    { label: 'Inventory', href: 'https://inventory.zenohosp.com', icon: Package },
                    { label: 'Assets', href: 'https://asset.zenohosp.com', icon: Box },
                ].map(({ label, href, icon: Icon }) => (
                    <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`sidebar-ext ${!isOpen ? 'is-icon-only' : ''}`}
                        title={!isOpen ? label : ""}
                        style={{ padding: isOpen ? '6px 12px' : '10px 0' }}
                    >
                        <Icon size={16} />
                        {isOpen && <span>{label}</span>}
                        {isOpen && <ArrowUpRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </a>
                ))}
            </div>
        </aside>
    );
}
