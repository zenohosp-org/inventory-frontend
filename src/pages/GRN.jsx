import { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';
import { getGrns } from '../api/client';
import './GRN.css';

export default function GRN() {
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        getGrns()
            .then(res => setGrns(Array.isArray(res.data) ? res.data : []))
            .catch(() => setGrns([]))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><ClipboardList size={24} /> Goods Received Notes</h1>
                    <p className="page-subtitle">GRN records generated on PO receipt. Each receipt creates one GRN.</p>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <span className="table-count">{grns.length} GRN{grns.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="table-loading">Loading…</div>
                ) : grns.length === 0 ? (
                    <div className="table-empty">No GRNs yet. Receive items from a Purchase Order to create the first GRN.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '2rem' }}></th>
                                <th>GRN No.</th>
                                <th>PO Number</th>
                                <th>Vendor</th>
                                <th>Received On</th>
                                <th>Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grns.map(grn => {
                                const po = grn.purchaseOrder;
                                const isOpen = !!expanded[grn.id];
                                return (
                                    <>
                                        <tr
                                            key={grn.id}
                                            className="grn-row"
                                            onClick={() => toggle(grn.id)}
                                        >
                                            <td>
                                                {isOpen
                                                    ? <ChevronDown size={15} className="grn-chevron" />
                                                    : <ChevronRight size={15} className="grn-chevron" />}
                                            </td>
                                            <td><strong>{grn.grnNumber}</strong></td>
                                            <td>{po?.poNumber || '-'}</td>
                                            <td>{po?.vendor?.name || '-'}</td>
                                            <td>{fmt(grn.receivedAt)}</td>
                                            <td>{grn.items?.length ?? 0} line{(grn.items?.length ?? 0) !== 1 ? 's' : ''}</td>
                                        </tr>
                                        {isOpen && (
                                            <tr key={grn.id + '-detail'} className="grn-detail-row">
                                                <td colSpan={6} style={{ padding: 0 }}>
                                                    <div className="grn-detail">
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
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
