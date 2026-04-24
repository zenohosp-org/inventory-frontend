import { useState } from 'react';
import api from '../api/client';
import { AlertCircle, Check } from 'lucide-react';

export default function ReceiveQuantityModal({ po, onClose, onSuccess }) {
    const [items, setItems] = useState(po.items.map(item => ({
        ...item,
        alreadyReceived: parseFloat(item.receivedQty || 0),
        toReceive: 0,
    })));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleQuantityChange = (itemIndex, value) => {
        const newItems = [...items];
        const ordered = parseFloat(newItems[itemIndex].quantity);
        const already = newItems[itemIndex].alreadyReceived;
        const remaining = ordered - already;
        const val = Math.min(Math.max(0, parseFloat(value) || 0), remaining);
        newItems[itemIndex].toReceive = val;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            items: items
                .filter(item => parseFloat(item.toReceive) > 0)
                .map(item => ({ poItemId: item.id, receivedQty: item.toReceive }))
        };
        if (payload.items.length === 0) {
            setError('Enter a quantity to receive for at least one item');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await api.post(`/api/inventory/po/${po.id}/record-receipt`, payload);
            setSuccess(true);
            setTimeout(() => { onSuccess(); }, 1500);
        } catch (err) {
            setError('Failed to record receipt: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                    <Check size={48} className="mx-auto text-green-600 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Success!</h2>
                    <p className="text-gray-600">Receipt recorded successfully</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Record Receipt - {po.poNumber}</h2>

                {error && (
                    <div className="alert alert-error mb-4">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr className="border-b">
                                    <th className="text-left px-3 py-2 font-medium">Item</th>
                                    <th className="text-center px-3 py-2 font-medium">Ordered</th>
                                    <th className="text-center px-3 py-2 font-medium">Received</th>
                                    <th className="text-center px-3 py-2 font-medium">Remaining</th>
                                    <th className="text-center px-3 py-2 font-medium">Receive Now</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const remaining = parseFloat(item.quantity) - item.alreadyReceived;
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="px-3 py-3">
                                                <p className="font-medium text-gray-900">{item.inventoryItem?.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">${parseFloat(item.unitPrice).toFixed(2)}/unit</p>
                                            </td>
                                            <td className="text-center px-3 py-3 font-medium">
                                                {parseFloat(item.quantity).toFixed(2)}
                                            </td>
                                            <td className="text-center px-3 py-3 text-gray-600">
                                                {item.alreadyReceived.toFixed(2)}
                                            </td>
                                            <td className="text-center px-3 py-3 text-gray-600">
                                                {remaining <= 0
                                                    ? <span className="text-green-600 font-medium">Done</span>
                                                    : remaining.toFixed(2)}
                                            </td>
                                            <td className="text-center px-3 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={remaining}
                                                    value={item.toReceive}
                                                    onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                    className="input-field w-20 text-center text-sm"
                                                    disabled={loading || remaining <= 0}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                            {loading ? 'Saving...' : 'Record Receipt'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary flex-1">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
