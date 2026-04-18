import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { logStock } from '../api/client';

export default function LogStockModal({ stock, onClose, onSuccess }) {
    const [transactionType, setTransactionType] = useState('INTERNAL_USE');
    const [quantity, setQuantity] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [batchNo, setBatchNo] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const transactionTypes = [
        { value: 'INTERNAL_USE', label: 'Internal Use', icon: '📤' },
        { value: 'RETURN', label: 'Return', icon: '↩️' },
        { value: 'EXPIRED_DISPOSED', label: 'Expired/Disposed', icon: '🗑️' },
        { value: 'PURCHASE_IN', label: 'Purchase In', icon: '📥' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!quantity || quantity <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        if (quantity > stock.quantityAvail && transactionType !== 'PURCHASE_IN') {
            setError(`Cannot ${transactionType.toLowerCase()} more than available quantity (${stock.quantityAvail})`);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                itemId: stock.itemId,
                storeId: stock.storeId,
                movementType: transactionType,
                quantity: Math.abs(parseInt(quantity)),
                notes: notes || '',
            };

            if (transactionType === 'PURCHASE_IN') {
                payload.vendorId = vendorId;
                payload.expiryDate = expiryDate || null;
                payload.batchNo = batchNo;
            } else if (transactionType === 'RETURN') {
                payload.reason = reason;
                payload.batchNo = batchNo;
                payload.notes = notes;
            } else if (transactionType === 'INTERNAL_USE') {
                payload.notes = notes;
            } else if (transactionType === 'EXPIRED_DISPOSED') {
                payload.batchNo = batchNo;
                payload.notes = notes;
            }

            await logStock(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log stock transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={() => onClose()}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Log Stock Transaction</h2>
                        <p className="modal-subtitle">{stock.itemName} ({stock.itemCode})</p>
                    </div>
                    <button onClick={() => onClose()} className="modal-close" aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <div className="stock-info-box">
                            <div className="stock-info-label">Current Stock Level</div>
                            <div className="stock-info-value">{stock.quantityAvail} units</div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Transaction Type</label>
                        <div className="txn-type-grid">
                            {transactionTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setTransactionType(type.value)}
                                    className={`transaction-type-btn ${transactionType === type.value ? 'active' : ''}`}
                                >
                                    <div>{type.icon}</div>
                                    <div>{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Quantity</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="form-input"
                            required
                        />
                        <p className="form-help">Maximum available: {stock.quantityAvail} units</p>
                    </div>

                    {transactionType === 'PURCHASE_IN' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Vendor ID (Optional)</label>
                                <input
                                    type="text"
                                    value={vendorId}
                                    onChange={(e) => setVendorId(e.target.value)}
                                    placeholder="Enter vendor ID"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch No</label>
                                <input
                                    type="text"
                                    value={batchNo}
                                    onChange={(e) => setBatchNo(e.target.value)}
                                    placeholder="Enter batch number"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </>
                    )}

                    {transactionType === 'RETURN' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Why is this being returned?"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch No</label>
                                <input
                                    type="text"
                                    value={batchNo}
                                    onChange={(e) => setBatchNo(e.target.value)}
                                    placeholder="Enter batch number"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional notes..."
                                    className="form-textarea"
                                    rows="2"
                                />
                            </div>
                        </>
                    )}

                    {transactionType === 'INTERNAL_USE' && (
                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Purpose of use, patient/staff assignment, etc."
                                className="form-textarea"
                                rows="2"
                            />
                        </div>
                    )}

                    {transactionType === 'EXPIRED_DISPOSED' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Batch No</label>
                                <input
                                    type="text"
                                    value={batchNo}
                                    onChange={(e) => setBatchNo(e.target.value)}
                                    placeholder="Enter batch number"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Reason for disposal, expiry date, etc."
                                    className="form-textarea"
                                    rows="2"
                                />
                            </div>
                        </>
                    )}

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
                        {loading ? 'Logging...' : 'Log Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
