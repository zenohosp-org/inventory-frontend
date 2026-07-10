import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
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
        <div className="main-content">
            <PageHeader
                title="Inventory Dashboard"
                subtitle={loading ? 'Loading overview...' : 'Live inventory overview for your hospital.'}
            />

            {/* Stat Cards */}
            <div className="card-grid">
                <div className="stat-card">
                    <div>
                        <div className="stat-label">Total Products</div>
                        <p>Active items in system</p>
                        <div className="stat-value">{stocks.length}</div>
                    </div>
                    <div className="stat-icon"><Package size={28} /></div>
                </div>
                <div className="stat-card warning">
                    <div>
                        <div className="stat-label">Low Stock</div>
                        <p>Below reorder level</p>
                        <div className="stat-value">{lowStockItems.length}</div>
                    </div>
                    <div className="stat-icon"><AlertCircle size={28} /></div>
                </div>
                <div className="stat-card danger">
                    <div>
                        <div className="stat-label">Expiring Soon</div>
                        <p>Within 30 days</p>
                        <div className="stat-value">{criticalExpiry.length}</div>
                    </div>
                    <div className="stat-icon"><AlertTriangle size={28} /></div>
                </div>
                <div className="stat-card success">
                    <div>
                        <div className="stat-label">Recent Transactions</div>
                        <p>Last loaded batch</p>
                        <div className="stat-value">{recentActivity.length}</div>
                    </div>
                    <div className="stat-icon"><Clock size={28} /></div>
                </div>
            </div>

            {/* Expiry Alerts */}
            {expiryAlerts.length > 0 && (
                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">
                            <AlertTriangle size={18} /> Expiry Alerts ({expiryAlerts.length})
                        </h3>
                    </div>
                    <div className="table-body">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Batch</th>
                                    <th>Store</th>
                                    <th>Qty Available</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiryAlerts.map(a => (
                                    <tr key={a.batchId}>
                                        <td>
                                            <strong>{a.itemName}</strong>
                                            {a.itemCode && <div className="text-muted mono">{stripHospitalPrefix(a.itemCode)}</div>}
                                        </td>
                                        <td className="mono text-muted">{a.batchNumber || '—'}</td>
                                        <td className="text-muted">{a.storeName}</td>
                                        <td><strong>{Number(a.quantityAvailable).toLocaleString()}</strong></td>
                                        <td>{new Date(a.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td><span className={`badge ${expiryBadgeClass(a.daysUntilExpiry)}`}>{expiryLabel(a.daysUntilExpiry)}</span></td>
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
                    <div className="table-body">
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

            {/* Recent Transactions */}
            {recentActivity.length > 0 && (
                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title"><Clock size={18} /> Recent Transactions</h3>
                    </div>
                    <div className="table-body">
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

            {showLogModal && selectedStock && (
                <LogStockModal
                    stock={selectedStock}
                    onClose={() => { setShowLogModal(false); setSelectedStock(null); }}
                    onSuccess={() => { setShowLogModal(false); setSelectedStock(null); fetchDashboardData(); }}
                />
            )}
        </div>
    );
};

export default Dashboard;
