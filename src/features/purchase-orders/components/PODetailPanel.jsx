import { X } from 'lucide-react';
import { STATUS_MAP } from '../utils/poHelpers';
import { stripHospitalPrefix } from '../../../utils/format';

export default function PODetailPanel({
    po,
    bill,
    grns,
    onClose,
    onReceive,
    onPayAdvance,
}) {
    const status = STATUS_MAP[po.status] || { label: po.status || '-', color: 'badge-secondary' };
    const total = Number(po.totalAmount || 0);
    const orderedItems = po.items || [];

    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div className="so-panel-name">{stripHospitalPrefix(po.poNumber) || po.id}</div>
                    <div className="so-panel-meta">
                        {po.vendor?.name || po.vendorName || '-'}
                        {po.store?.name ? ` · ${po.store.name}` : ''}
                    </div>
                    <div className="so-panel-stats">
                        <div>
                            <div className="so-stat-label">Status</div>
                            <div className="so-stat-value" style={{ fontSize: 13 }}>
                                <span className={`badge ${status.color}`}>{status.label}</span>
                            </div>
                        </div>
                        <div>
                            <div className="so-stat-label">Total</div>
                            <div className="so-stat-value">₹{total.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="so-stat-label">GRNs</div>
                            <div className="so-stat-value so-stat-value--incoming">{grns.length}</div>
                        </div>
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose} aria-label="Close panel">
                    <X size={16} />
                </button>
            </div>

            <div className="so-panel-body">
                {/* Ordered items */}
                <div className="so-card">
                    <div className="so-card-header">Ordered Items</div>
                    <div className="so-card-body is-flush">
                        <table className="po-detail-items">
                            <colgroup>
                                <col className="col-item" />
                                <col className="col-ord" />
                                <col className="col-rcvd" />
                                <col className="col-amount" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style={{ textAlign: 'center' }}>Ord</th>
                                    <th style={{ textAlign: 'center' }}>Rcvd</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderedItems.map(it => {
                                    const recv = Number(it.receivedQty || 0);
                                    const ord = Number(it.quantity || 0);
                                    const amt = Number(it.unitPrice || 0) * ord;
                                    return (
                                        <tr key={it.id}>
                                            <td title={it.inventoryItem?.name || '-'}>{it.inventoryItem?.name || '-'}</td>
                                            <td className="is-num" style={{ textAlign: 'center' }}>{ord}</td>
                                            <td className="is-num" style={{ textAlign: 'center', color: recv >= ord ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{recv}</td>
                                            <td className="is-num" style={{ textAlign: 'right' }}>₹{amt.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="so-card">
                    <div className="so-card-header">Actions</div>
                    <div className="so-card-body">
                        <div className="po-detail-actions">
                            {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                <button className="btn btn-sm btn-primary" onClick={onReceive}>Receive Items</button>
                            )}
                            {bill?.paymentStatus !== 'PAID' && (
                                <button className="btn btn-sm btn-accent" onClick={onPayAdvance}>Pay Advance</button>
                            )}
                            {po.status === 'BILLED' && <span className="text-muted">Already Billed</span>}
                        </div>
                    </div>
                </div>

                {/* Linked Bill */}
                {bill && (
                    <div className="so-card so-card--bill">
                        <div className="so-card-header">Linked Bill</div>
                        <div className="so-card-body is-flush">
                            <div className="so-row-kv">
                                <div>
                                    <div className="so-row-kv-title">{stripHospitalPrefix(bill.billNumber) || bill.id}</div>
                                    <div className="so-row-kv-sub">
                                        Paid ₹{Number(bill.paidAmount || 0).toLocaleString()} of ₹{Number(bill.totalAmount || 0).toLocaleString()}
                                    </div>
                                </div>
                                <span className={`badge ${bill.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                    {bill.paymentStatus || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* GRNs */}
                <div className="so-card so-card--grn">
                    <div className="so-card-header">Goods Received Notes ({grns.length})</div>
                    <div className="so-card-body is-flush">
                        {grns.length === 0 ? (
                            <div className="so-txn-empty">No receipts yet.</div>
                        ) : (
                            grns.map(g => (
                                <div key={g.id} className="so-row-kv">
                                    <div>
                                        <div className="so-row-kv-title">{stripHospitalPrefix(g.grnNumber)}</div>
                                        <div className="so-row-kv-sub">
                                            {g.receivedAt ? new Date(g.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                            {` · ${g.items?.length || 0} line${g.items?.length === 1 ? '' : 's'}`}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
