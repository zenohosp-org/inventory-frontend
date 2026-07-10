import { X, RefreshCw } from 'lucide-react';
import { STATUS_MAP } from '../utils/poHelpers';
import { stripHospitalPrefix } from '../../../utils/format';

const SYNC_META = {
    SUCCESS: { label: 'Asset Sync: Synced',  cls: 'badge-success' },
    FAILED:  { label: 'Asset Sync: Failed',   cls: 'badge-error'   },
    PENDING: { label: 'Asset Sync: Pending',  cls: 'badge-warning'  },
};

export default function PODetailPanel({
    po,
    bill,
    grns,
    syncLog,
    onClose,
    onReceive,
    onPayAdvance,
    onRetrySync,
    onApprove,
    onCancel,
}) {
    const status = STATUS_MAP[po.status] || { label: po.status || '-', color: 'badge-secondary' };
    const total = Number(po.totalAmount || 0);
    const orderedItems = po.items || [];
    const hasAssetItems = orderedItems.some(it => it.inventoryItem?.billingGroup === 'ASSET');
    const isDraft = po.status === 'DRAFT';
    const isCancelled = po.status === 'CANCELLED';
    const canReceive = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';
    const canPay = !isDraft && !isCancelled && bill?.paymentStatus !== 'PAID';

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
                            <div className="so-stat-value so-stat-value--badge">
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
                        <div className="zu-table-wrapper"><table className="zu-table">
                            <colgroup>
                                <col className="col-item" />
                                <col className="col-ord" />
                                <col className="col-rcvd" />
                                <col className="col-amount" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="is-center">Ord</th>
                                    <th className="is-center">Rcvd</th>
                                    <th className="is-right">Amount</th>
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
                                            <td className="is-num is-center">{ord}</td>
                                            <td className={`is-num is-center ${recv >= ord ? 'rcvd-done' : 'rcvd-partial'}`}>{recv}</td>
                                            <td className="is-num is-right">₹{amt.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table></div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="so-card">
                    <div className="so-card-header">Actions</div>
                    <div className="so-card-body">
                        <div className="po-detail-actions">
                            {isDraft && (
                                <>
                                    <button className="btn btn-sm btn-success" onClick={onApprove}>Approve</button>
                                    <button className="btn btn-sm btn-ghost po-cancel-btn" onClick={onCancel}>Cancel PO</button>
                                </>
                            )}
                            {canReceive && (
                                <button className="btn btn-sm btn-primary" onClick={onReceive}>Receive Items</button>
                            )}
                            {canPay && (
                                <button className="btn btn-sm btn-accent" onClick={onPayAdvance}>Pay Advance</button>
                            )}
                            {po.status === 'BILLED' && <span className="text-muted">Already Billed</span>}
                            {isCancelled && (
                                <span className="text-muted">
                                    Cancelled
                                    {po.cancelledByEmail ? ` by ${po.cancelledByEmail}` : ''}
                                    {po.cancelledAt ? ` on ${new Date(po.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Asset Sync Status */}
                {hasAssetItems && (
                    <div className="so-card so-card--sync">
                        <div className="so-card-header">Asset Sync</div>
                        <div className="so-card-body">
                            {!syncLog ? (
                                <span className="badge badge-secondary">No sync record</span>
                            ) : (
                                <div className="po-sync-row">
                                    <div className="po-sync-info">
                                        <span className={`badge ${SYNC_META[syncLog.status]?.cls || 'badge-secondary'}`}>
                                            {SYNC_META[syncLog.status]?.label || syncLog.status}
                                        </span>
                                        {syncLog.attemptCount > 0 && (
                                            <span className="po-sync-attempts">{syncLog.attemptCount} attempt{syncLog.attemptCount !== 1 ? 's' : ''}</span>
                                        )}
                                        {syncLog.lastError && (
                                            <span className="po-sync-error" title={syncLog.lastError}>
                                                {syncLog.lastError.length > 60 ? syncLog.lastError.slice(0, 60) + '…' : syncLog.lastError}
                                            </span>
                                        )}
                                    </div>
                                    {syncLog.status === 'FAILED' && onRetrySync && (
                                        <button
                                            className="btn btn-sm btn-outline po-sync-retry"
                                            onClick={() => onRetrySync(po.id)}
                                        >
                                            <RefreshCw size={13} />
                                            Retry
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
