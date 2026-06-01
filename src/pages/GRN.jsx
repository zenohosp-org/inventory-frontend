import { useState, useMemo } from 'react';
import { ClipboardList, X, Package } from 'lucide-react';
import { getGrns } from '../api/client';
import { useQuery } from '../hooks/useQuery';
import { stripHospitalPrefix } from '../utils/format';
import './GRN.css';

export default function GRN() {
    const { data: grns = [], loading } = useQuery('grns', () => getGrns().then(r => Array.isArray(r.data) ? r.data : []));
    const [panelKey, setPanelKey] = useState(null);
    const [expandedGrns, setExpandedGrns] = useState({});

    const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
    const toggleGrn = (id) => setExpandedGrns(prev => ({ ...prev, [id]: !prev[id] }));

    // Group GRNs by PO.
    const groupedByPo = useMemo(() => {
        const groups = new Map();
        for (const grn of grns) {
            const po = grn.purchaseOrder;
            const key = po?.id || po?.poNumber || `__no-po__-${grn.id}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    poNumber: po?.poNumber || '—',
                    vendorName: po?.vendor?.name || '—',
                    poStatus: po?.status || null,
                    grns: [],
                    latestAt: null,
                });
            }
            const g = groups.get(key);
            g.grns.push(grn);
            const ts = grn.receivedAt ? new Date(grn.receivedAt).getTime() : 0;
            if (!g.latestAt || ts > g.latestAt) g.latestAt = ts;
        }
        const arr = Array.from(groups.values());
        arr.sort((a, b) => (b.latestAt || 0) - (a.latestAt || 0));
        for (const g of arr) {
            g.grns.sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0));
        }
        return arr;
    }, [grns]);

    const panelGroup = panelKey ? groupedByPo.find(g => g.key === panelKey) : null;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ClipboardList size={24} /> Goods Received Notes</h1>
                    <p className="page-subtitle">Click a PO row to see its GRN receipts.</p>
                </div>
            </div>

            <div className="so-layout">
                <div className="table-container so-table-wrap">
                    <div className="table-header">
                        <h3 className="table-title">GRNs ({grns.length})</h3>
                        <span className="text-muted so-hint">Click a row to see receipts</span>
                    </div>
                    <div className="table-body">
                        {loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : groupedByPo.length === 0 ? (
                            <div className="table-empty">No GRNs yet. Receive items from a Purchase Order to create the first GRN.</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>PO Number</th>
                                        <th>Vendor</th>
                                        <th>GRNs</th>
                                        <th>Last Received</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedByPo.map(group => {
                                        const isSelected = panelKey === group.key;
                                        return (
                                            <tr
                                                key={group.key}
                                                className={`so-row${isSelected ? ' so-row-selected' : ''}`}
                                                onClick={() => setPanelKey(isSelected ? null : group.key)}
                                            >
                                                <td><strong>{stripHospitalPrefix(group.poNumber)}</strong></td>
                                                <td>{group.vendorName}</td>
                                                <td>
                                                    <span className="grn-count-pill">
                                                        {group.grns.length} GRN{group.grns.length !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td>{group.latestAt ? fmt(new Date(group.latestAt)) : '-'}</td>
                                                <td>
                                                    {group.poStatus
                                                        ? <span className={`grn-status grn-status-${group.poStatus.toLowerCase()}`}>{group.poStatus}</span>
                                                        : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {panelGroup && (
                    <div className="so-panel">
                        <div className="so-panel-header">
                            <div>
                                <div className="so-panel-name">{stripHospitalPrefix(panelGroup.poNumber)}</div>
                                <div className="so-panel-meta">
                                    {panelGroup.vendorName}
                                    {panelGroup.poStatus ? ` · ${panelGroup.poStatus}` : ''}
                                </div>
                                <div className="so-panel-stats">
                                    <div>
                                        <div className="so-stat-label">GRNs</div>
                                        <div className="so-stat-value so-stat-value--incoming">{panelGroup.grns.length}</div>
                                    </div>
                                    <div>
                                        <div className="so-stat-label">Last Received</div>
                                        <div className="so-stat-value" style={{ fontSize: 13 }}>
                                            {panelGroup.latestAt ? fmt(new Date(panelGroup.latestAt)) : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="so-panel-close" onClick={() => setPanelKey(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="so-txn-heading">
                            Receipts ({panelGroup.grns.length})
                        </div>
                        <div className="so-txn-scroll">
                            {panelGroup.grns.map(grn => {
                                const isOpen = !!expandedGrns[grn.id];
                                const lineCount = grn.items?.length ?? 0;
                                return (
                                    <div
                                        key={grn.id}
                                        className="so-txn-row grn-receipt-row"
                                        onClick={() => toggleGrn(grn.id)}
                                    >
                                        <div className="so-txn-body">
                                            <div className="so-txn-top">
                                                <span className="so-txn-badge grn-receipt-badge">
                                                    <Package size={11} /> {stripHospitalPrefix(grn.grnNumber)}
                                                </span>
                                                <span className="so-txn-qty so-txn-qty--pos">+{lineCount}</span>
                                            </div>
                                            <div className="so-txn-date">{fmt(grn.receivedAt)}</div>
                                            {isOpen && lineCount > 0 && (
                                                <div className="grn-receipt-items">
                                                    {(grn.items || []).map(line => (
                                                        <div key={line.id} className="grn-receipt-line">
                                                            <div className="grn-receipt-line-name">{line.inventoryItem?.name || '-'}</div>
                                                            <div className="grn-receipt-line-meta">
                                                                Qty {line.receivedQty}
                                                                {line.store?.name ? ` · ${line.store.name}` : ''}
                                                                {line.batchNumber ? ` · Batch ${line.batchNumber}` : ''}
                                                                {line.expiryDate ? ` · Exp ${line.expiryDate}` : ''}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
