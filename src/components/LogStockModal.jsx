import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { logStock } from '../api/client';

export default function LogStockModal({ stock, onClose, onSuccess }) {
    const [transactionType, setTransactionType] = useState('INTERNAL_USE');
    const [quantity, setQuantity] = useState('');
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const transactionTypes = [
        { value: 'INTERNAL_USE', label: '📤 Internal Use', icon: '📤' },
        { value: 'RETURN', label: '↩️ Return', icon: '↩️' },
        { value: 'EXPIRED_DISPOSED', label: '🗑️ Expired/Disposed', icon: '🗑️' },
        { value: 'PURCHASE_IN', label: '📥 Purchase In', icon: '📥' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
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
                transactionType,
                quantity: Math.abs(parseInt(quantity)),
                remarks: remarks || `${transactionType.toLowerCase()} transaction`,
            };

            await logStock(payload);
            onSuccess();
        } catch (err) {
            console.error('Error logging stock:', err);
            setError(err.response?.data?.message || 'Failed to log stock transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={() => onClose()}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Log Stock Transaction</h2>
                        <p style={{
                            fontSize: 'var(--fs-sm)',
                            color: 'var(--color-gray-600)',
                            margin: 'var(--spacing-1) 0 0 0'
                        }}>
                            {stock.itemName} ({stock.itemCode})
                        </p>
                    </div>
                    <button
                        onClick={() => onClose()}
                        className="modal-close"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Current Stock Info */}
                    <div className="form-group">
                        <div className="info-box" style={{
                            backgroundColor: 'var(--color-blue-50)',
                            borderLeft: '4px solid var(--color-blue-500)',
                            padding: 'var(--spacing-3)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)'
                        }}>
                            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-gray-600)' }}>
                                Current Stock Level
                            </div>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: 'var(--color-blue-700)',
                                marginTop: 'var(--spacing-1)'
                            }}>
                                {stock.quantityAvail} units
                            </div>
                        </div>
                    </div>

                    {/* Transaction Type Selection */}
                    <div className="form-group">
                        <label className="form-label">Transaction Type</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 'var(--spacing-2)',
                            marginBottom: 'var(--spacing-4)'
                        }}>
                            {transactionTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setTransactionType(type.value)}
                                    className={`transaction-type-btn ${transactionType === type.value ? 'active' : ''}`}
                                    style={{
                                        padding: 'var(--spacing-3)',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${transactionType === type.value ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
                                        backgroundColor: transactionType === type.value ? 'var(--color-primary-50)' : 'var(--color-gray-50)',
                                        cursor: 'pointer',
                                        fontSize: 'var(--fs-sm)',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div>{type.icon}</div>
                                    <div>{type.label.split(' ').slice(1).join(' ')}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Input */}
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
                        <p className="form-help" style={{
                            fontSize: 'var(--fs-xs)',
                            color: 'var(--color-gray-500)',
                            marginTop: 'var(--spacing-2)'
                        }}>
                            Maximum available: {stock.quantityAvail} units
                        </p>
                    </div>

                    {/* Remarks Input */}
                    <div className="form-group">
                        <label className="form-label">Remarks (Optional)</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add any notes about this transaction..."
                            className="form-textarea"
                            rows="3"
                            style={{
                                fontFamily: 'inherit',
                                padding: 'var(--spacing-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-gray-300)',
                                fontSize: 'var(--fs-sm)'
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="alert alert-error" style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--spacing-2)',
                            marginBottom: 'var(--spacing-4)',
                            padding: 'var(--spacing-3)',
                            backgroundColor: 'var(--color-error-50)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-error-200)'
                        }}>
                            <AlertCircle size={18} style={{ color: 'var(--color-error)', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: 'var(--color-error)', fontSize: 'var(--fs-sm)' }}>
                                {error}
                            </span>
                        </div>
                    )}
                </form>

                {/* Modal Footer */}
                <div className="modal-footer" style={{
                    display: 'flex',
                    gap: 'var(--spacing-2)',
                    justifyContent: 'flex-end',
                    padding: 'var(--spacing-4)',
                    borderTop: '1px solid var(--color-gray-200)'
                }}>
                    <button
                        type="button"
                        onClick={() => onClose()}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !quantity}
                        className="btn btn-primary"
                        style={{
                            opacity: loading || !quantity ? 0.6 : 1,
                            cursor: loading || !quantity ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Logging...' : 'Log Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
