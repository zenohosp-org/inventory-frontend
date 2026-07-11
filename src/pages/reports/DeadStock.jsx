import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageX, Wallet, Search } from 'lucide-react';
import { getDeadStock } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import { stripHospitalPrefix } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
const WINDOWS = [30, 60, 90, 180];

export default function DeadStock() {
    const navigate = useNavigate();
    const [days, setDays] = useState(60);
    const [search, setSearch] = useState('');
    const { data: raw, loading, error } = useQuery(['dead-stock', days], () => getDeadStock(days));
    const rows = useMemo(() => {
        const d = raw?.data ?? raw;
        return Array.isArray(d) ? d : [];
    }, [raw]);

    const visibleRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            (r.itemName || '').toLowerCase().includes(q) ||
            (r.itemCode || '').toLowerCase().includes(q) ||
            (r.storeName || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const valueAtRisk = rows.reduce((a, r) => a + (Number(r.costValue) || 0), 0);

    return (
        <div className="zu-page">
            <PageHeader
                title="Dead Stock"
                subtitle="Stock on hand with no outbound movement in a while"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="filter-bar">
                    <div className="filter-group">
                        <label className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            Idle for at least
                            <select className="form-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                                {WINDOWS.map((n) => <option key={n} value={n}>{n} days</option>)}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="card-grid">
                    <div className="stat-card danger">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><PackageX size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Idle Lines</div>
                        <p>{`No movement in ${days}+ days`}</p>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Wallet size={20} /></div>
                        </div>
                        <div className="stat-value">{inr(valueAtRisk)}</div>
                        <div className="stat-label">Value at Risk</div>
                        <p>Capital sitting idle</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search item, code, or store..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">Idle Stock ({visibleRows.length})</h3>
                    </div>
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Store</th>
                                    <th className="text-right">Qty on Hand</th>
                                    <th className="text-right">Value</th>
                                    <th>Last Movement</th>
                                    <th className="text-right">Idle For</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">{rows.length === 0 ? `No idle stock found for ${days}+ days.` : `No items match "${search}".`}</td></tr>
                                ) : visibleRows.map((r) => (
                                    <tr key={`${r.itemId}-${r.storeId}`}>
                                        <td>
                                            <strong>{r.itemName}</strong>
                                            {r.itemCode && <div className="text-muted mono">{stripHospitalPrefix(r.itemCode)}</div>}
                                        </td>
                                        <td className="text-muted">{r.storeName}</td>
                                        <td className="text-right"><strong>{Number(r.quantityOnHand).toLocaleString()}</strong> {r.unit}</td>
                                        <td className="text-right text-muted">{inr(r.costValue)}</td>
                                        <td className="text-muted">
                                            {r.neverMoved ? <span className="badge badge-secondary">Never moved</span> : fmtDate(r.lastMovementAt)}
                                        </td>
                                        <td className="text-right"><strong className="text-danger">{r.daysIdle}d</strong></td>
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
