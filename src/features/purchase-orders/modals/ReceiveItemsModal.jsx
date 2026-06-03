import { AlertTriangle, X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import { getDestination } from '../utils/poHelpers';
import { stripHospitalPrefix } from '../../../utils/format';

export default function ReceiveItemsModal({
    po, activeStores,
    receiptQtys, setReceiptQtys,
    submitting,
    onSubmit, onClose,
}) {
    const hasAssetItems = po?.items?.some(i => i.inventoryItem?.billingGroup === 'ASSET');
    const storeLabel = s => `${s.name}${s.type ? ` (${s.type})` : ''}`;

    const updateField = (itemId, field, value) =>
        setReceiptQtys(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));

    return (
        <div className="modal-overlay active">
            <div className="modal po-receive-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Receive Items — {stripHospitalPrefix(po.poNumber)}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </div>

                {hasAssetItems && (
                    <div className="po-receive-asset-notice">
                        <AlertTriangle size={16} />
                        <span>
                            <strong>Asset items in this order.</strong>{' '}
                            Items routed to the Asset Register will be automatically registered as assets upon receipt.
                        </span>
                    </div>
                )}

                <div className="modal-body">
                    <div className="po-receive-items">
                        {(po.items || []).map(item => {
                            const inv = item.inventoryItem;
                            const dest = getDestination(inv);
                            const val = receiptQtys[item.id] || { qty: '', storeId: '', batchNumber: '', expiryDate: '', mrp: '', sellingPrice: '' };
                            const ordered = Number(item.quantity || 0);
                            const alreadyReceived = Number(item.receivedQty ?? 0);
                            const remaining = ordered - alreadyReceived;
                            const pct = ordered > 0 ? Math.min((alreadyReceived / ordered) * 100, 100) : 0;
                            const isDone = remaining <= 0;
                            const isPharmacy = inv?.billingGroup === 'PHARMACY';

                            return (
                                <div key={item.id} className="po-receive-item-card">
                                    <div className="po-receive-item-top">
                                        <div>
                                            <span className="po-receive-item-name">{inv?.name || '-'}</span>
                                            {inv?.itemTypeName && (
                                                <span className="po-receive-item-type">{inv.itemTypeName}</span>
                                            )}
                                        </div>
                                        {dest && (
                                            <span className={`po-receive-dest-tag po-receive-dest-tag--${dest.mod}`}>
                                                → {dest.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className="po-receive-item-body">
                                        <div className="po-receive-progress">
                                            <div className="po-receive-progress-meta">
                                                <span>Ordered: <strong>{ordered}</strong> · Received: <strong>{alreadyReceived}</strong></span>
                                                <span className={isDone ? 'po-receive-remaining--done' : 'po-receive-remaining--pending'}>
                                                    {isDone ? 'Fully received' : `${remaining} remaining`}
                                                </span>
                                            </div>
                                            <div className="po-receive-progress-bar">
                                                <div
                                                    className={`po-receive-progress-fill ${pct >= 100 ? 'po-receive-progress-fill--done' : 'po-receive-progress-fill--partial'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="po-receive-field po-receive-field--full">
                                            <label className="po-receive-field-label">
                                                Receive into Store <span className="text-danger">*</span>
                                            </label>
                                            <SearchableSelect
                                                value={val.storeId}
                                                onChange={v => updateField(item.id, 'storeId', v)}
                                                options={activeStores}
                                                getId={s => s.id}
                                                getLabel={storeLabel}
                                                placeholder="Select store..."
                                            />
                                        </div>

                                        <div className="po-receive-fields">
                                            <div className="po-receive-field po-receive-field--sm">
                                                <label className="po-receive-field-label">Qty</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    step="any"
                                                    className="form-input"
                                                    value={val.qty}
                                                    onChange={e => updateField(item.id, 'qty', e.target.value)}
                                                    placeholder="0"
                                                    disabled={isDone}
                                                />
                                            </div>

                                            <div className="po-receive-field po-receive-field--md">
                                                <label className="po-receive-field-label">
                                                    Batch No {(inv?.batchRequired || isPharmacy) ? <span className="text-danger">*</span> : <span className="text-muted">(opt)</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={val.batchNumber}
                                                    onChange={e => updateField(item.id, 'batchNumber', e.target.value)}
                                                    placeholder="e.g. BT-2024-001"
                                                    disabled={isDone}
                                                />
                                            </div>

                                            <div className="po-receive-field po-receive-field--md">
                                                <label className="po-receive-field-label">
                                                    Expiry {(inv?.expiryRequired || isPharmacy) ? <span className="text-danger">*</span> : <span className="text-muted">(opt)</span>}
                                                </label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={val.expiryDate}
                                                    onChange={e => updateField(item.id, 'expiryDate', e.target.value)}
                                                    disabled={isDone}
                                                />
                                            </div>
                                        </div>

                                        {isPharmacy && (
                                            <div className="po-receive-fields">
                                                <div className="po-receive-field po-receive-field--md">
                                                    <label className="po-receive-field-label">MRP (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        value={val.mrp}
                                                        onChange={e => updateField(item.id, 'mrp', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="po-receive-field po-receive-field--md">
                                                    <label className="po-receive-field-label">Selling Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        value={val.sellingPrice}
                                                        onChange={e => updateField(item.id, 'sellingPrice', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
                        {submitting ? 'Saving...' : 'Confirm Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
}
