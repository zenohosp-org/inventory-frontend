import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Wallet, Clock, Search } from 'lucide-react';
import { getVendorPerformance } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Below this, a vendor's on-time record is worth a conversation.
const LOW_ON_TIME_PERCENT = 70;

export default function VendorPerformance() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: raw, loading, error } = useQuery('vendor-performance', getVendorPerformance);
    const rows = useMemo(() => {
        const d = raw?.data ?? raw;
        return Array.isArray(d) ? d : [];
    }, [raw]);

    const visibleRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r => (r.vendorName || '').toLowerCase().includes(q));
    }, [rows, search]);

    const totalSpend = rows.reduce((a, r) => a + (Number(r.totalSpend) || 0), 0);
    const tracked = rows.filter(r => r.onTimePercent != null);
    const avgOnTime = tracked.length > 0
        ? tracked.reduce((a, r) => a + Number(r.onTimePercent), 0) / tracked.length
        : null;

    return (
        <div className="zu-page">
            <PageHeader
                title="Vendor Performance"
                subtitle="Spend and on-time delivery record by vendor"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="card-grid">
                    <div className="stat-card primary">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Truck size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Vendors</div>
                        <p>With an order placed</p>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Wallet size={20} /></div>
                        </div>
                        <div className="stat-value">{inr(totalSpend)}</div>
                        <div className="stat-label">Total Spend</div>
                        <p>Across all orders</p>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Clock size={20} /></div>
                        </div>
                        <div className="stat-value">{avgOnTime != null ? `${avgOnTime.toFixed(0)}%` : '—'}</div>
                        <div className="stat-label">Avg On-Time Rate</div>
                        <p>{tracked.length > 0 ? `Across ${tracked.length} vendor(s) with tracked deliveries` : 'No deliveries tracked yet'}</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search vendor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">Vendors ({visibleRows.length})</h3>
                    </div>
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Vendor</th>
                                    <th className="text-right">Orders</th>
                                    <th className="text-right">Pending</th>
                                    <th className="text-right">Total Spend</th>
                                    <th className="text-right">Avg Order Value</th>
                                    <th className="text-right">On-Time Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">{rows.length === 0 ? 'No purchase orders yet.' : `No vendors match "${search}".`}</td></tr>
                                ) : visibleRows.map((r) => {
                                    const lowOnTime = r.onTimePercent != null && r.onTimePercent < LOW_ON_TIME_PERCENT;
                                    return (
                                        <tr key={r.vendorId}>
                                            <td><strong>{r.vendorName}</strong></td>
                                            <td className="text-right text-muted">{r.orderCount}</td>
                                            <td className="text-right">
                                                {r.pendingOrders > 0 ? <span className="badge badge-warning">{r.pendingOrders}</span> : <span className="text-muted">0</span>}
                                            </td>
                                            <td className="text-right"><strong>{inr(r.totalSpend)}</strong></td>
                                            <td className="text-right text-muted">{inr(r.avgOrderValue)}</td>
                                            <td className="text-right">
                                                {r.onTimePercent == null ? (
                                                    <span className="text-muted" title="No deliveries with both an expected date and a receipt yet">—</span>
                                                ) : (
                                                    <strong className={lowOnTime ? 'text-danger' : 'text-success'} title={`${r.deliveriesTracked} delivery(ies) tracked`}>
                                                        {r.onTimePercent}%
                                                    </strong>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
