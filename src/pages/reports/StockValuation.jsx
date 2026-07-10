import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Tag, Package, Search } from 'lucide-react';
import { getStockValuation } from '../../api/client';
import { useQuery } from '../../hooks/useQuery';
import { stripHospitalPrefix } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Flag razor-thin margins — worth a pricing review before they're barely covering handling cost.
const LOW_MARGIN_PERCENT = 15;

export default function StockValuation() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: raw, loading, error } = useQuery('stock-valuation', getStockValuation);
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
            (r.storeName || '').toLowerCase().includes(q) ||
            (r.batchNumber || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totals = useMemo(() => rows.reduce((acc, r) => ({
        cost: acc.cost + (Number(r.costValue) || 0),
        retail: acc.retail + (Number(r.retailValue) || 0),
    }), { cost: 0, retail: 0 }), [rows]);
    const totalMarginPercent = totals.cost > 0 ? ((totals.retail - totals.cost) / totals.cost) * 100 : null;

    return (
        <div className="zu-page">
            <PageHeader
                title="Stock Valuation"
                subtitle="On-hand stock valued at cost and at selling price"
                onBack={() => navigate('/reports')}
            />
            <div className="zu-page-content">
                <div className="card-grid">
                    <div className="stat-card primary">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Wallet size={20} /></div>
                        </div>
                        <div className="stat-value">{inr(totals.cost)}</div>
                        <div className="stat-label">Cost Value</div>
                        <p>Capital tied up in stock</p>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Tag size={20} /></div>
                        </div>
                        <div className="stat-value">{inr(totals.retail)}</div>
                        <div className="stat-label">Retail Value</div>
                        <p>{totalMarginPercent != null ? `${totalMarginPercent.toFixed(0)}% margin overall` : 'At selling price'}</p>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper"><Package size={20} /></div>
                        </div>
                        <div className="stat-value">{rows.length}</div>
                        <div className="stat-label">Batches</div>
                        <p>With stock on hand</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search item, code, batch, or store..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-bar-input"
                            />
                        </div>
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
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Cost / Unit</th>
                                    <th className="text-right">Selling / Unit</th>
                                    <th className="text-right">Margin</th>
                                    <th className="text-right">Cost Value</th>
                                    <th className="text-right">Retail Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="table-empty"><div className="spinner"></div></td></tr>
                                ) : error ? (
                                    <tr><td colSpan={9} className="table-empty text-danger">Failed to load report: {error.message || 'unknown error'}</td></tr>
                                ) : visibleRows.length === 0 ? (
                                    <tr><td colSpan={9} className="table-empty">{rows.length === 0 ? 'No stock on hand.' : `No items match "${search}".`}</td></tr>
                                ) : visibleRows.map((r) => {
                                    const cost = Number(r.purchasePrice) || 0;
                                    const sell = Number(r.sellingPrice) || 0;
                                    const marginPercent = cost > 0 ? ((sell - cost) / cost) * 100 : null;
                                    const lowMargin = marginPercent != null && marginPercent < LOW_MARGIN_PERCENT;
                                    return (
                                        <tr key={r.batchId}>
                                            <td>
                                                <strong>{r.itemName}</strong>
                                                {r.itemCode && <div className="text-muted mono">{stripHospitalPrefix(r.itemCode)}</div>}
                                            </td>
                                            <td className="mono text-muted">{r.batchNumber || '—'}</td>
                                            <td className="text-muted">{r.storeName}</td>
                                            <td className="text-right"><strong>{Number(r.quantityAvail).toLocaleString()}</strong> {r.unit}</td>
                                            <td className="text-right text-muted">{inr(r.purchasePrice)}</td>
                                            <td className="text-right text-muted">{inr(r.sellingPrice)}</td>
                                            <td className="text-right">
                                                {marginPercent == null ? (
                                                    <span className="text-muted">—</span>
                                                ) : (
                                                    <strong className={lowMargin ? 'text-danger' : 'text-success'}>
                                                        {marginPercent.toFixed(0)}%
                                                    </strong>
                                                )}
                                            </td>
                                            <td className="text-right"><strong>{inr(r.costValue)}</strong></td>
                                            <td className="text-right text-muted">{inr(r.retailValue)}</td>
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
