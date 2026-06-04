import { useState, useEffect } from 'react';
import { X, AlertCircle, ArrowUpFromLine, Trash2, Undo2, Package } from 'lucide-react';
import { logStock, getStockBatches } from '../api/client';
import { stripHospitalPrefix } from '../utils/format';

const ACTIONS = [
    {
        value: 'INTERNAL_USE',
        label: 'Dispensed',
        helper: 'Used for patient or department',
        Icon: ArrowUpFromLine,
        mod: 'dispensed',
    },
    {
        value: 'EXPIRED_DISPOSED',
        label: 'Expired / Damaged',
        helper: 'Disposed — cannot be used',
        Icon: Trash2,
        mod: 'expired',
    },
    {
        value: 'RETURN',
        label: 'Return to Vendor',
        helper: 'Sent back to supplier',
        Icon: Undo2,
        mod: 'return',
    },
];

export default function LogStockModal({ stock, onClose, onSuccess }) {
    const [action, setAction] = useState('INTERNAL_USE');
    const [quantity, setQuantity] = useState('');
    const [batchId, setBatchId] = useState('');
    const [batchNo, setBatchNo] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [batches, setBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    const isPharmacy = stock.billingGroup === 'PHARMACY';
    const requireBatch = isPharmacy;

    useEffect(() => {
        if (!requireBatch) return;
        let cancelled = false;
        setBatchesLoading(true);
        getStockBatches(stock.storeId, stock.itemId)
            .then(res => {
                if (cancelled) return;
                const arr = Array.isArray(res.data) ? res.data : [];
                setBatches(arr.filter(b => Number(b.quantityAvailable) > 0));
            })
            .catch(() => { if (!cancelled) setBatches([]); })
            .finally(() => { if (!cancelled) setBatchesLoading(false); });
        return () => { cancelled = true; };
    }, [requireBatch, stock.storeId, stock.itemId]);

    const selectedBatch = batches.find(b => b.id === batchId);
    const maxQty = requireBatch && selectedBatch
        ? Number(selectedBatch.quantityAvailable)
        : Number(stock.quantityAvail);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError('');

        const q = Number(quantity);
        if (!q || q <= 0) { setError('Enter a quantity greater than zero'); return; }
        if (q > maxQty) {
            setError(requireBatch
                ? `Only ${maxQty} units available in the selected batch`
                : `Only ${maxQty} units available in this store`);
            return;
        }
        if (requireBatch && !batchId) { setError('Select a batch'); return; }
        if (action === 'RETURN' && !reason.trim()) { setError('Enter a return reason'); return; }

        const payload = {
            itemId: stock.itemId,
            storeId: stock.storeId,
            movementType: action,
            quantity: q,
            notes: notes || (action === 'RETURN' ? reason : ''),
        };
        if (requireBatch && selectedBatch) {
            payload.batchNo = selectedBatch.batchNumber;
        } else if (batchNo.trim()) {
            payload.batchNo = batchNo.trim();
        }

        try {
            setLoading(true);
            await logStock(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to adjust stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={() => onClose()}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Adjust Stock</h2>
                        <p className="modal-subtitle">
                            <strong>{stock.itemName}</strong>
                            {stock.itemCode ? ` · ${stripHospitalPrefix(stock.itemCode)}` : ''}
                        </p>
                    </div>
                    <button onClick={() => onClose()} className="modal-close" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Current stock summary */}
                    <div className="adjust-stock-summary">
                        <div className="adjust-stock-summary-item">
                            <span className="adjust-stock-summary-label">Current Stock</span>
                            <span className="adjust-stock-summary-val">{stock.quantityAvail}</span>
                        </div>
                        {stock.reorderLevel != null && (
                            <div className="adjust-stock-summary-item">
                                <span className="adjust-stock-summary-label">Reorder Level</span>
                                <span className="adjust-stock-summary-val adjust-stock-summary-val--muted">{stock.reorderLevel}</span>
                            </div>
                        )}
                    </div>

                    {/* Action picker */}
                    <div className="form-group">
                        <label className="form-label">What happened?</label>
                        <div className="adjust-action-grid">
                            {ACTIONS.map(a => (
                                <button
                                    key={a.value}
                                    type="button"
                                    onClick={() => setAction(a.value)}
                                    className={`adjust-action-card adjust-action-card--${a.mod}${action === a.value ? ' is-active' : ''}`}
                                >
                                    <a.Icon size={20} className="adjust-action-icon" />
                                    <span className="adjust-action-label">{a.label}</span>
                                    <span className="adjust-action-helper">{a.helper}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Batch picker (pharmacy only) */}
                    {requireBatch && (
                        <div className="form-group">
                            <label className="form-label">Batch <span className="form-label-required">*</span></label>
                            {batchesLoading ? (
                                <div className="adjust-batch-empty"><div className="spinner-sm"></div> Loading batches…</div>
                            ) : batches.length === 0 ? (
                                <div className="adjust-batch-empty">No batches with stock in this store</div>
                            ) : (
                                <div className="adjust-batch-list">
                                    {batches.map(b => {
                                        const days = b.expiryDate ? Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000) : null;
                                        const expiryCls = days == null ? '' : days < 0 ? 'adjust-batch-pill--expired'
                                            : days <= 30 ? 'adjust-batch-pill--critical'
                                            : days <= 60 ? 'adjust-batch-pill--warn' : 'adjust-batch-pill--ok';
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => setBatchId(b.id)}
                                                className={`adjust-batch-row${batchId === b.id ? ' is-selected' : ''}`}
                                            >
                                                <Package size={14} className="adjust-batch-icon" />
                                                <span className="adjust-batch-no">{b.batchNumber || 'No batch'}</span>
                                                <span className="adjust-batch-qty">{Number(b.quantityAvailable)} avail</span>
                                                {b.expiryDate && (
                                                    <span className={`adjust-batch-pill ${expiryCls}`}>
                                                        {days < 0 ? 'Expired' : `${days}d`}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="form-group">
                        <label className="form-label">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className="form-input"
                            required
                        />
                        <p className="form-help">Max: {maxQty} unit{maxQty !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Optional batch No for non-pharmacy items */}
                    {!requireBatch && (
                        <div className="form-group">
                            <label className="form-label">Batch No <span className="form-label-optional">(optional)</span></label>
                            <input
                                type="text"
                                value={batchNo}
                                onChange={(e) => setBatchNo(e.target.value)}
                                placeholder="e.g. B-001"
                                className="form-input"
                            />
                        </div>
                    )}

                    {/* Reason for return */}
                    {action === 'RETURN' && (
                        <div className="form-group">
                            <label className="form-label">Reason <span className="form-label-required">*</span></label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Why is this being returned?"
                                className="form-input"
                                required
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Notes <span className="form-label-optional">(optional)</span></label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={action === 'INTERNAL_USE' ? 'Patient / department / purpose' : 'Any additional detail'}
                            className="form-textarea"
                            rows="2"
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                </form>

                <div className="modal-footer">
                    <button type="button" onClick={() => onClose()} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !quantity} className="btn btn-primary">
                        {loading ? 'Saving…' : 'Confirm Adjustment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
