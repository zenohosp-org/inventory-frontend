import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Wallet, Search } from 'lucide-react';
import { getPurchaseOrders } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import { stripHospitalPrefix } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const PENDING_STATUSES = new Set(['ORDERED', 'PARTIALLY_RECEIVED']);

function receivedPercent(po) {
    const items = po.items || [];
    const ordered = items.reduce((a, i) => a + (Number(i.quantity) || 0), 0);
    const received = items.reduce((a, i) => a + (Number(i.receivedQty) || 0), 0);
    return ordered > 0 ? Math.round((received / ordered) * 100) : 0;
}

export default function POAging() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: raw, loading, error } = useQuery('purchase-orders', getPurchaseOrders);
    const allPos = useMemo(() => {
        const d = raw?.data ?? raw;
        return Array.isArray(d) ? d : [];
    }, [raw]);

    const rows = useMemo(() => {
        return allPos
            .filter(po => PENDING_STATUSES.has(po.status))
            .map(po => {
                const daysOverdue = po.expectedDate
                    ? Math.floor((Date.now() - new Date(po.expectedDate).getTime()) / 86400000)
                    : null;
                return { ...po, daysOverdue, receivedPercent: receivedPercent(po) };
            })
            .sort((a, b) => (b.daysOverdue ?? -Infinity) - (a.daysOverdue ?? -Infinity));
    }, [allPos]);

    const visibleRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            (r.poNumber || '').toLowerCase().includes(q) ||
            (r.vendor?.name || '').toLowerCase().includes(q) ||
            (r.store?.name || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const overdue = rows.filter(r => r.daysOverdue != null && r.daysOverdue > 0);
    const pendingValue = rows.reduce((a, r) => a + (Number(r.totalAmount) || 0), 0);

    return (
        <div className="zu-page">
            <PageHeader
                title="PO Aging"
                subtitle="Orders placed but not yet fully received"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="card-grid">
                    <div className="stat-card primary">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Clock size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Pending Orders</div>
                        <p>Ordered or partially received</p>
                    </div>
                    <div className="stat-card danger">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
                        </div>
                        <div className="stat-value">{overdue.length}</div>
                        <div className="stat-label">Overdue</div>
                        <p>Past their expected date</p>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Wallet size={20} /></div>
                        </div>
                        <div className="stat-value">{inr(pendingValue)}</div>
                        <div className="stat-label">Value Pending</div>
                        <p>Across all open orders</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search PO, vendor, or store..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">Open Purchase Orders ({visibleRows.length})</h3>
                    </div>
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>PO #</th>
                                    <th>Vendor</th>
                                    <th>Store</th>
                                    <th>Expected</th>
                                    <th className="text-right">Received</th>
                                    <th className="text-right">Value</th>
                                    <th className="text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={7} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr><td colSpan={7} className="table-empty">{rows.length === 0 ? 'No open purchase orders — everything is received or cancelled.' : `No orders match "${search}".`}</td></tr>
                                ) : visibleRows.map((r) => (
                                    <tr key={r.id}>
                                        <td><strong className="mono">{stripHospitalPrefix(r.poNumber) || r.id}</strong></td>
                                        <td>{r.vendor?.name || '—'}</td>
                                        <td className="text-muted">{r.store?.name || '—'}</td>
                                        <td className="text-muted">{r.expectedDate ? new Date(r.expectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                        <td className="text-right text-muted">{r.receivedPercent}%</td>
                                        <td className="text-right"><strong>{inr(r.totalAmount)}</strong></td>
                                        <td className="text-right">
                                            {r.daysOverdue == null ? (
                                                <span className="text-muted" title="No expected date set">—</span>
                                            ) : r.daysOverdue > 0 ? (
                                                <span className="badge badge-error">{r.daysOverdue}d overdue</span>
                                            ) : (
                                                <span className="badge badge-secondary">{Math.abs(r.daysOverdue)}d left</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
