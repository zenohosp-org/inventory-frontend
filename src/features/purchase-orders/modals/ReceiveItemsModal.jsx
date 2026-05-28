import { X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import { getDestination } from '../utils/poHelpers';

export default function ReceiveItemsModal({
    po, activeStores,
    receiptQtys, setReceiptQtys,
    submitting,
    onSubmit, onClose,
}) {
    const hasAssetItems = po?.items?.some(item => item.inventoryItem?.billingGroup === 'ASSET');
    const storeLabel = s => `${s.name}${s.type ? ` (${s.type})` : ''}`;

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ maxWidth: '580px', width: '100%' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Receive Items — {po.poNumber}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                {hasAssetItems && (
                    <div style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', padding: '0.75rem 1.25rem' }}>
                        <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                            <strong>Asset items in this order</strong><br />
                            Items routed to the Asset Register will be <strong>automatically registered as assets</strong> upon receipt.
                        </div>
                    </div>
                )}
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(po.items || []).map(item => {
                        const inv = item.inventoryItem;
                        const dest = getDestination(inv);
                        const val = receiptQtys[item.id] || { qty: '', storeId: '', batchNumber: '', expiryDate: '' };
                        const remaining = Number(item.quantity) - Number(item.receivedQty ?? 0);
                        const updateField = (field, value) =>
                            setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], [field]: value } }));

                        return (
                            <div key={item.id} style={{ border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9375rem' }}>{inv?.name || '-'}</strong>
                                        {inv?.itemTypeName && (
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{inv.itemTypeName}</span>
                                        )}
                                    </div>
                                    {dest && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: dest.color + '18', color: dest.color, whiteSpace: 'nowrap' }}>
                                            → {dest.label}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                                    <span>Ordered: <strong>{item.quantity}</strong></span>
                                    <span>Received: <strong>{item.receivedQty ?? 0}</strong></span>
                                    <span>Remaining: <strong style={{ color: remaining > 0 ? 'inherit' : '#10b981' }}>{remaining}</strong></span>
                                </div>

                                <div>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>
                                        Receive into Store <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <SearchableSelect
                                        value={val.storeId}
                                        onChange={v => updateField('storeId', v)}
                                        options={activeStores}
                                        getId={s => s.id}
                                        getLabel={storeLabel}
                                        placeholder="Select store..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1', minWidth: '80px' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty to Receive</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={remaining}
                                            step="any"
                                            className="form-input"
                                            value={val.qty}
                                            onChange={e => updateField('qty', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>

                                    {(inv?.batchRequired || inv?.billingGroup === 'PHARMACY') && (
                                        <div style={{ flex: '2', minWidth: '120px' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Batch No <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={val.batchNumber}
                                                onChange={e => updateField('batchNumber', e.target.value)}
                                                placeholder="e.g. BT-2024-001"
                                            />
                                        </div>
                                    )}

                                    {(inv?.expiryRequired || inv?.billingGroup === 'PHARMACY') && (
                                        <div style={{ flex: '2', minWidth: '130px' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={val.expiryDate}
                                                onChange={e => updateField('expiryDate', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {inv?.billingGroup === 'PHARMACY' && (
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '1', minWidth: '110px' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>MRP (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-input"
                                                value={val.mrp}
                                                onChange={e => updateField('mrp', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div style={{ flex: '1', minWidth: '110px' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Selling Price (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-input"
                                                value={val.sellingPrice}
                                                onChange={e => updateField('sellingPrice', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
