import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { transferStock } from '../api/client';

export default function TransferStockModal({ stock, fromStoreId, stores, onClose, onSuccess }) {
    const [toStoreId, setToStoreId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const destinationStores = stores.filter(s => s.id !== fromStoreId && s.isActive !== false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!toStoreId) {
            setError('Please select a destination store');
            return;
        }
        if (!quantity || Number(quantity) <= 0) {
            setError('Please enter a valid quantity');
            return;
        }
        if (Number(quantity) > Number(stock.quantityAvail)) {
            setError(`Cannot transfer more than available quantity (${stock.quantityAvail})`);
            return;
        }

        try {
            setLoading(true);
            await transferStock({
                fromStoreId,
                toStoreId,
                itemId: stock.itemId,
                quantity: Number(quantity),
                remarks,
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">Transfer Stock — {stock.itemName}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="error-banner">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Item</label>
                            <input className="form-input" value={stock.itemName} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Available Quantity</label>
                            <input className="form-input" value={stock.quantityAvail} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destination Store</label>
                            <select
                                className="form-input"
                                value={toStoreId}
                                onChange={e => setToStoreId(e.target.value)}
                                required
                            >
                                <option value="">Select store...</option>
                                {destinationStores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Quantity to Transfer</label>
                            <input
                                type="number"
                                className="form-input"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                min="0.01"
                                step="any"
                                max={stock.quantityAvail}
                                placeholder="Enter quantity"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Remarks (optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Reason for transfer"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Transferring...' : 'Transfer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
