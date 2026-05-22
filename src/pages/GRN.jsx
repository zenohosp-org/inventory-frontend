import { useState, useEffect, useMemo, Fragment } from 'react';
import { ClipboardList, ChevronDown, ChevronRight, FileText, Package } from 'lucide-react';
import { getGrns } from '../api/client';
import './GRN.css';

export default function GRN() {
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPos, setExpandedPos] = useState({});
    const [expandedGrns, setExpandedGrns] = useState({});

    useEffect(() => {
        getGrns()
            .then(res => setGrns(Array.isArray(res.data) ? res.data : []))
            .catch(() => setGrns([]))
            .finally(() => setLoading(false));
    }, []);

    const togglePo = (key) => setExpandedPos(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleGrn = (id) => setExpandedGrns(prev => ({ ...prev, [id]: !prev[id] }));

    const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    // Group GRNs by PO number.
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
        // Sort groups by latest receipt desc; sort GRNs in each group desc.
        const arr = Array.from(groups.values());
        arr.sort((a, b) => (b.latestAt || 0) - (a.latestAt || 0));
        for (const g of arr) {
            g.grns.sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0));
        }
        return arr;
    }, [grns]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ClipboardList size={24} /> Goods Received Notes</h1>
                    <p className="page-subtitle">Grouped by purchase order. Expand a PO to see all its GRN receipts.</p>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">GRNs ({grns.length})</h3>
                </div>
                <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : groupedByPo.length === 0 ? (
                    <div className="table-empty">No GRNs yet. Receive items from a Purchase Order to create the first GRN.</div>
                ) : (
                    <table className="table grn-table">
                        <thead>
                            <tr>
                                <th className="grn-col-toggle"></th>
                                <th>PO Number</th>
                                <th>Vendor</th>
                                <th>GRNs</th>
                                <th>Last Received</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedByPo.map(group => {
                                const isPoOpen = !!expandedPos[group.key];
                                return (
                                    <Fragment key={group.key}>
                                        <tr
                                            className="grn-po-row"
                                            onClick={() => togglePo(group.key)}
                                        >
                                            <td>
                                                {isPoOpen
                                                    ? <ChevronDown size={15} className="grn-chevron" />
                                                    : <ChevronRight size={15} className="grn-chevron" />}
                                            </td>
                                            <td>
                                                <span className="grn-po-icon"><FileText size={14} /></span>
                                                <strong>{group.poNumber}</strong>
                                            </td>
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
                                        {isPoOpen && (
                                            <tr className="grn-detail-row">
                                                <td colSpan={6} className="grn-detail-cell">
                                                    <div className="grn-po-detail">
                                                        <table className="grn-sub-table">
                                                            <thead>
                                                                <tr>
                                                                    <th className="grn-col-toggle"></th>
                                                                    <th>GRN No.</th>
                                                                    <th>Received On</th>
                                                                    <th>Items</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.grns.map(grn => {
                                                                    const isGrnOpen = !!expandedGrns[grn.id];
                                                                    const lineCount = grn.items?.length ?? 0;
                                                                    return (
                                                                        <Fragment key={grn.id}>
                                                                            <tr
                                                                                className="grn-row"
                                                                                onClick={() => toggleGrn(grn.id)}
                                                                            >
                                                                                <td>
                                                                                    {isGrnOpen
                                                                                        ? <ChevronDown size={14} className="grn-chevron" />
                                                                                        : <ChevronRight size={14} className="grn-chevron" />}
                                                                                </td>
                                                                                <td>
                                                                                    <span className="grn-grn-icon"><Package size={13} /></span>
                                                                                    <strong>{grn.grnNumber}</strong>
                                                                                </td>
                                                                                <td>{fmt(grn.receivedAt)}</td>
                                                                                <td>{lineCount} line{lineCount !== 1 ? 's' : ''}</td>
                                                                            </tr>
                                                                            {isGrnOpen && (
                                                                                <tr className="grn-items-row">
                                                                                    <td colSpan={4} className="grn-detail-cell">
                                                                                        <div className="grn-items-wrap">
                                                                                            <table className="grn-items-table">
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th>Item</th>
                                                                                                        <th>Store</th>
                                                                                                        <th>Qty</th>
                                                                                                        <th>Unit Price</th>
                                                                                                        <th>Batch</th>
                                                                                                        <th>Expiry</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {(grn.items || []).map(line => (
                                                                                                        <tr key={line.id}>
                                                                                                            <td>{line.inventoryItem?.name || '-'}</td>
                                                                                                            <td>{line.store?.name || '-'}</td>
                                                                                                            <td>{line.receivedQty}</td>
                                                                                                            <td>{line.unitPrice != null ? `₹${Number(line.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}</td>
                                                                                                            <td>{line.batchNumber || '-'}</td>
                                                                                                            <td>{line.expiryDate || '-'}</td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </Fragment>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
        </div>
    );
}
