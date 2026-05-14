import { useState } from 'react';
import api from '../api/client';
import { AlertCircle, Check } from 'lucide-react';

export default function ReceiveQuantityModal({ po, onClose, onSuccess }) {
    const [items, setItems] = useState(po.items.map(item => ({
        ...item,
        alreadyReceived: parseFloat(item.receivedQty || 0),
        toReceive: 0,
        mrp: item.mrp ?? '',
        sellingPrice: item.sellingPrice ?? '',
    })));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const isPharmacy = (item) => item.inventoryItem?.billingGroup === 'PHARMACY';

    const handleQuantityChange = (itemIndex, value) => {
        const newItems = [...items];
        const ordered = parseFloat(newItems[itemIndex].quantity);
        const already = newItems[itemIndex].alreadyReceived;
        const remaining = ordered - already;
        const val = Math.min(Math.max(0, parseFloat(value) || 0), remaining);
        newItems[itemIndex].toReceive = val;
        setItems(newItems);
    };

    const handleFieldChange = (itemIndex, field, value) => {
        const newItems = [...items];
        newItems[itemIndex][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            items: items
                .filter(item => parseFloat(item.toReceive) > 0)
                .map(item => ({
                    poItemId: item.id,
                    receivedQty: item.toReceive,
                    batchNumber: item.batchNumber || null,
                    expiryDate: item.expiryDate || null,
                    mrp: isPharmacy(item) && item.mrp !== '' ? parseFloat(item.mrp) : null,
                    sellingPrice: isPharmacy(item) && item.sellingPrice !== '' ? parseFloat(item.sellingPrice) : null,
                }))
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

    const hasPharmacyItems = items.some(isPharmacy);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Record Receipt - {po.poNumber}</h2>

                {error && (
                    <div className="alert alert-error mb-4">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {hasPharmacyItems && (
                    <p className="text-sm text-blue-600 bg-blue-50 rounded px-3 py-2 mb-4">
                        Pharmacy items will auto-sync to pharmacy stock on receipt.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr className="border-b">
                                    <th className="text-left px-3 py-2 font-medium">Item</th>
                                    <th className="text-center px-3 py-2 font-medium">Ordered</th>
                                    <th className="text-center px-3 py-2 font-medium">Received</th>
                                    <th className="text-center px-3 py-2 font-medium">Receive Now</th>
                                    {hasPharmacyItems && (
                                        <>
                                            <th className="text-center px-3 py-2 font-medium">MRP (₹)</th>
                                            <th className="text-center px-3 py-2 font-medium">Sell Price (₹)</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => {
                                    const remaining = parseFloat(item.quantity) - item.alreadyReceived;
                                    const pharmacy = isPharmacy(item);
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="px-3 py-3">
                                                <p className="font-medium text-gray-900">{item.inventoryItem?.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">₹{parseFloat(item.unitPrice).toFixed(2)}/unit</p>
                                                {pharmacy && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Pharmacy</span>
                                                )}
                                            </td>
                                            <td className="text-center px-3 py-3 font-medium">
                                                {parseFloat(item.quantity).toFixed(2)}
                                            </td>
                                            <td className="text-center px-3 py-3 text-gray-600">
                                                {item.alreadyReceived.toFixed(2)}
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
                                                {remaining <= 0 && (
                                                    <span className="text-green-600 font-medium text-xs block">Done</span>
                                                )}
                                            </td>
                                            {hasPharmacyItems && (
                                                <>
                                                    <td className="text-center px-3 py-3">
                                                        {pharmacy ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.mrp}
                                                                onChange={(e) => handleFieldChange(idx, 'mrp', e.target.value)}
                                                                className="input-field w-24 text-center text-sm"
                                                                placeholder="0.00"
                                                                disabled={loading}
                                                            />
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="text-center px-3 py-3">
                                                        {pharmacy ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.sellingPrice}
                                                                onChange={(e) => handleFieldChange(idx, 'sellingPrice', e.target.value)}
                                                                className="input-field w-24 text-center text-sm"
                                                                placeholder="0.00"
                                                                disabled={loading}
                                                            />
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                </>
                                            )}
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
