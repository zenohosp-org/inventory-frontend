import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight, AlertTriangle, Search } from 'lucide-react';
import { getPriceVariance } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import { stripHospitalPrefix } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Flag items where the highest price paid is at least 2x the lowest — usually
// either a genuine vendor-shopping win/loss or a data-entry typo worth a look.
const SPREAD_FLAG_RATIO = 2;

function PriceRange({ minPrice, maxPrice, avgPrice, latestPrice }) {
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || 0;
    const span = max - min;
    const pct = (v) => span > 0 ? Math.min(100, Math.max(0, ((Number(v) - min) / span) * 100)) : 50;

    return (
        <div className="pv-range">
            <div className="pv-range-track">
                <div className="pv-range-marker pv-range-avg" style={{ left: `${pct(avgPrice)}%` }} title={`Avg ${inr(avgPrice)}`} />
                <div className="pv-range-marker pv-range-latest" style={{ left: `${pct(latestPrice)}%` }} title={`Latest ${inr(latestPrice)}`} />
            </div>
            <div className="pv-range-labels">
                <span>{inr(min)}</span>
                <span>{inr(max)}</span>
            </div>
        </div>
    );
}

export default function PriceVariance() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: raw, loading, error } = useQuery('price-variance', getPriceVariance);
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
            (r.latestVendorName || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const increased = rows.filter(r => Number(r.variancePercent) > 0).length;
    const decreased = rows.filter(r => Number(r.variancePercent) < 0).length;

    return (
        <div className="zu-page">
            <PageHeader
                title="Price Variance"
                subtitle="How much you've paid for each item across purchase orders"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="card-grid">
                    <div className="stat-card primary">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><ArrowLeftRight size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Items Tracked</div>
                        <p>With 1+ received purchase</p>
                    </div>
                    <div className="stat-card danger">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><TrendingUp size={20} /></div>
                        </div>
                        <div className="stat-value">{increased}</div>
                        <div className="stat-label">Price Increased</div>
                        <p>Vs. previous purchase</p>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><TrendingDown size={20} /></div>
                        </div>
                        <div className="stat-value">{decreased}</div>
                        <div className="stat-label">Price Decreased</div>
                        <p>Vs. previous purchase</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search item, code, or vendor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="text-right">Purchases</th>
                                    <th>Price Range (min → max)</th>
                                    <th className="text-right">Previous</th>
                                    <th className="text-right">Latest</th>
                                    <th>Vendor</th>
                                    <th>Last Purchased</th>
                                    <th className="text-right">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={8} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr><td colSpan={8} className="table-empty">{rows.length === 0 ? 'No received purchases yet.' : `No items match "${search}".`}</td></tr>
                                ) : visibleRows.map((r) => {
                                    const minP = Number(r.minPrice) || 0;
                                    const maxP = Number(r.maxPrice) || 0;
                                    const highSpread = r.purchaseCount > 1 && minP > 0 && (maxP / minP) >= SPREAD_FLAG_RATIO;
                                    const variance = r.variancePercent == null ? null : Number(r.variancePercent);
                                    return (
                                        <tr key={r.itemId}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <strong>{r.itemName}</strong>
                                                    {highSpread && (
                                                        <AlertTriangle
                                                            size={14}
                                                            className="text-danger"
                                                            title={`Price has varied ${(maxP / minP).toFixed(1)}x across purchases (${inr(minP)} – ${inr(maxP)}) — worth double-checking`}
                                                        />
                                                    )}
                                                </div>
                                                {r.itemCode && <div className="text-muted mono">{stripHospitalPrefix(r.itemCode)}</div>}
                                            </td>
                                            <td className="text-right text-muted">{r.purchaseCount}</td>
                                            <td>
                                                <PriceRange minPrice={r.minPrice} maxPrice={r.maxPrice} avgPrice={r.avgPrice} latestPrice={r.latestPrice} />
                                            </td>
                                            <td className="text-right text-muted">{r.previousPrice != null ? inr(r.previousPrice) : '—'}</td>
                                            <td className="text-right"><strong>{inr(r.latestPrice)}</strong></td>
                                            <td className="text-muted">{r.latestVendorName || '—'}</td>
                                            <td className="text-muted">{fmtDate(r.latestPurchaseDate)}</td>
                                            <td className="text-right">
                                                {variance == null ? (
                                                    <span className="text-muted">—</span>
                                                ) : (
                                                    <strong className={`pv-change ${variance > 0 ? 'text-danger' : variance < 0 ? 'text-success' : 'text-muted'}`}>
                                                        {variance > 0 ? <TrendingUp size={14} /> : variance < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
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
