import React, { useState, useEffect, useMemo } from 'react';
import { Package, AlertCircle, Clock, AlertTriangle, Plus, PieChart as PieIcon, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import LogStockModal from '../components/LogStockModal';
import { getStockOverview, getStockLogs, getExpiryAlerts } from '../api/client';
import { stripHospitalPrefix } from '../utils/format';
import PageHeader from '../components/PageHeader';

const ACTIVITY_LABELS = {
    purchase_in: 'Purchase In',
    internal_use: 'Internal Use',
    transfer: 'Transfer',
    expired_disposed: 'Disposed',
    return: 'Return',
};

function expiryBadgeClass(days) {
    if (days < 0) return 'badge-error';
    if (days <= 30) return 'badge-error';
    if (days <= 60) return 'badge-warning';
    return 'badge-secondary';
}

function expiryLabel(days) {
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return 'Expires today';
    return `${days}d left`;
}

const Dashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [expiryAlerts, setExpiryAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const categoryData = useMemo(() => {
        const counts = {};
        stocks.forEach(s => {
            const cat = s.categoryName || 'Uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [stocks]);

    const transactionData = useMemo(() => {
        const byDate = {};
        recentActivity.forEach(a => {
            // Using the timestamp which is already formatted like "7/10/2026, 1:30 PM"
            // We extract just the date part for grouping
            const d = a.timestamp.split(',')[0];
            if (!byDate[d]) byDate[d] = { date: d, in: 0, out: 0 };
            if (Number(a.quantity) > 0) byDate[d].in += Number(a.quantity);
            else byDate[d].out += Math.abs(Number(a.quantity));
        });
        return Object.values(byDate).reverse();
    }, [recentActivity]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [stockRes, transRes, expiryRes] = await Promise.all([
                getStockOverview(),
                getStockLogs({ page: 0, size: 10 }),
                getExpiryAlerts().catch(() => ({ data: [] })),
            ]);

            let stockData = stockRes.data || stockRes;
            if (typeof stockData === 'string') stockData = JSON.parse(stockData);
            stockData = Array.isArray(stockData) ? stockData : [];
            setStocks(stockData);

            let transPayload = transRes.data || transRes;
            if (typeof transPayload === 'string') transPayload = JSON.parse(transPayload);
            const txns = Array.isArray(transPayload?.content) ? transPayload.content
                : Array.isArray(transPayload) ? transPayload.slice(0, 10) : [];
            setRecentActivity(txns.map((t, idx) => ({
                id: t.id || idx,
                type: t.transactionType?.toLowerCase().replace(/_/g, '_'),
                product: t.itemName,
                quantity: t.quantity,
                location: t.storeName,
                timestamp: new Date(t.createdAt).toLocaleString(),
            })));

            setExpiryAlerts(Array.isArray(expiryRes.data) ? expiryRes.data : []);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const lowStockItems = stocks.filter(s => s.quantityAvail <= s.reorderLevel).slice(0, 5);
    const criticalExpiry = expiryAlerts.filter(a => a.daysUntilExpiry <= 30);

    return (
        <div className="zu-page">
            <PageHeader
                title="Inventory Dashboard"
                subtitle={loading ? 'Loading overview...' : 'Live inventory overview for your hospital.'}
            />
            <div className="zu-page-content">


            {/* Stat Cards */}
            <div className="card-grid">
                <div className="stat-card primary">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><Package size={20} /></div>
                    </div>
                    <div className="stat-value">{stocks.length}</div>
                    <div className="stat-label">Total Products</div>
                    <p>Active items in system</p>
                </div>
                <div className="stat-card success">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><AlertCircle size={20} /></div>
                    </div>
                    <div className="stat-value">{lowStockItems.length}</div>
                    <div className="stat-label">Low Stock</div>
                    <p>Below reorder level</p>
                </div>
                <div className="stat-card danger">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
                    </div>
                    <div className="stat-value">{criticalExpiry.length}</div>
                    <div className="stat-label">Expiring Soon</div>
                    <p>Within 30 days</p>
                </div>
                <div className="stat-card warning">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><Clock size={20} /></div>
                    </div>
                    <div className="stat-value">{recentActivity.length}</div>
                    <div className="stat-label">Recent Transactions</div>
                    <p>Last loaded batch</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="dashboard-bento" style={{ marginBottom: '24px' }}>
                <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="table-header">
                        <h3 className="table-title"><Activity size={18} /> Transaction Velocity (Recent)</h3>
                    </div>
                    <div style={{ padding: '20px', height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={transactionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="in" name="Stock In" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="out" name="Stock Out" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="table-header">
                        <h3 className="table-title"><PieIcon size={18} /> Stock by Category</h3>
                    </div>
                    <div style={{ padding: '20px', height: '240px' }}>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-500)' }}>
                                No category data
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Bento Layout Below Cards */}
            <div className="dashboard-bento">
                
                {/* Left Main Column */}
                <div className="dashboard-bento-main">
                    
                    {/* Recent Transactions */}
                    {recentActivity.length > 0 && (
                        <div className="table-container">
                            <div className="table-header">
                                <h3 className="table-title"><Clock size={18} /> Recent Transactions</h3>
                            </div>
                            <div className="zu-table-wrapper">
                                <table className="zu-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Location</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentActivity.map(a => (
                                            <tr key={a.id}>
                                                <td><span className="badge badge-primary">{ACTIVITY_LABELS[a.type] || a.type}</span></td>
                                                <td><strong>{a.product}</strong></td>
                                                <td className={Number(a.quantity) >= 0 ? 'text-success' : 'text-danger'}>
                                                    {Number(a.quantity) >= 0 ? '+' : ''}{a.quantity}
                                                </td>
                                                <td className="text-muted">{a.location}</td>
                                                <td className="text-muted">{a.timestamp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Low Stock Alerts */}
                    {lowStockItems.length > 0 && (
                        <div className="table-container">
                            <div className="table-header">
                                <h3 className="table-title">
                                    <AlertCircle size={18} /> Low Stock ({lowStockItems.length})
                                </h3>
                            </div>
                            <div className="zu-table-wrapper">
                                <table className="zu-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Code</th>
                                            <th>In Stock</th>
                                            <th>Reorder Level</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{item.itemName}</strong></td>
                                                <td className="mono text-muted">{stripHospitalPrefix(item.itemCode) || '—'}</td>
                                                <td><strong className="text-danger">{item.quantityAvail} {item.unit}</strong></td>
                                                <td className="text-muted">{item.reorderLevel} {item.unit}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-primary" onClick={() => { setSelectedStock(item); setShowLogModal(true); }}>
                                                        <Plus size={14} /> Log Stock
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column */}
                <div className="dashboard-bento-sidebar">
                    {/* Expiry Alerts Compact List */}
                    {expiryAlerts.length > 0 && (
                        <div className="table-container">
                            <div className="table-header" style={{ paddingBottom: '16px' }}>
                                <h3 className="table-title">
                                    <AlertTriangle size={18} /> Expiry Alerts ({expiryAlerts.length})
                                </h3>
                            </div>
                            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {expiryAlerts.map(a => (
                                    <div key={a.batchId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--zu-gray-200)', borderRadius: '8px', background: 'var(--zu-gray-50)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{a.itemName}</div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>Qty: {Number(a.quantityAvailable).toLocaleString()} • Batch: <span className="mono">{a.batchNumber || '—'}</span></div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${expiryBadgeClass(a.daysUntilExpiry)}`}>{expiryLabel(a.daysUntilExpiry)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showLogModal && selectedStock && (
                <LogStockModal
                    stock={selectedStock}
                    onClose={() => { setShowLogModal(false); setSelectedStock(null); }}
                    onSuccess={() => { setShowLogModal(false); setSelectedStock(null); fetchDashboardData(); }}
                />
            )}
                    </div>
        </div>
    );
};

export default Dashboard;
