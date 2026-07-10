import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package } from 'lucide-react';
import { getExpiryAlerts } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import { stripHospitalPrefix } from '../../utils/format';
import PageHeader from '../../components/PageHeader';

const WINDOWS = [30, 60, 90, 180];

function expiryBadgeClass(days) {
    if (days <= 30) return 'badge-error';
    if (days <= 60) return 'badge-warning';
    return 'badge-secondary';
}

function expiryLabel(days) {
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return 'Expires today';
    return `${days}d left`;
}

export default function NearExpiry() {
    const navigate = useNavigate();
    const [days, setDays] = useState(90);
    const { data: raw, loading, error } = useQuery(['near-expiry', days], () => getExpiryAlerts(days));
    const rows = useMemo(() => {
        const d = raw?.data ?? raw;
        return Array.isArray(d) ? d : [];
    }, [raw]);

    return (
        <div className="zu-page">
            <PageHeader
                title="Near-Expiry"
                subtitle="Batches expiring soon"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="table-header" style={{ marginBottom: 16 }}>
                    <label className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Window
                        <select className="form-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                            {WINDOWS.map((n) => <option key={n} value={n}>{n} days</option>)}
                        </select>
                    </label>
                </div>

                <div className="card-grid">
                    <div className="stat-card danger">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Batches</div>
                        <p>{`Expiring within ${days} days`}</p>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Package size={20} /></div>
                        </div>
                        <div className="stat-value">
                            {rows.reduce((a, r) => a + (Number(r.quantityAvailable) || 0), 0).toLocaleString()}
                        </div>
                        <div className="stat-label">Units at Risk</div>
                        <p>Across all near-expiry batches</p>
                    </div>
                </div>
                <div className="so-layout">
                    <div className="zu-table-wrapper so-table-wrap">
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
                                {loading ? (
                                    <tr><td colSpan={6} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">No batches expiring in this window.</td></tr>
                                ) : rows.map((a) => (
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
            </div>
        </div>
    );
}
