import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, RotateCcw, ActivitySquare, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LogStockModal({ stock, onClose, onSuccess }) {
    const { getAuthHeaders } = useAuth();

    // Internal use is default
    const [movementType, setMovementType] = useState('INTERNAL_USE');

    const [quantity, setQuantity] = useState('');

    // "Purchase In" Specific
    const [vendorId, setVendorId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [batchNo, setBatchNo] = useState('');

    // "Return" Specific
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    // "Internal Use" Specific
    const [assignPatientId, setAssignPatientId] = useState('');
    const [assignStaffId, setAssignStaffId] = useState('');

    // Options
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (movementType === 'PURCHASE_IN') {
            fetchVendors();
        }
    }, [movementType]);

    const fetchVendors = async () => {
        try {
            const res = await axios.get('/api/vendors', { headers: getAuthHeaders() });
            setVendors(res.data || []);
        } catch (error) {
            console.error('Failed to fetch vendors');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!quantity || quantity <= 0) return alert('Enter a valid quantity');
        setLoading(true);

        const payload = {
            movementType,
            storeId: stock.storeId,
            itemId: stock.itemId,
            quantity: quantity,

            // conditional
            vendorId: movementType === 'PURCHASE_IN' ? vendorId : null,
            expiryDate: movementType === 'PURCHASE_IN' ? expiryDate : null,
            batchNo: ['PURCHASE_IN', 'RETURN', 'EXPIRED_DISPOSED'].includes(movementType) ? batchNo : null,

            reason: movementType === 'RETURN' ? reason : null,
            notes: notes,

            assignPatientId: assignPatientId || null,
            assignStaffId: assignStaffId || null
        };

        try {
            await axios.post('/api/inventory/log-stock', payload, { headers: getAuthHeaders() });
            onSuccess();
        } catch (error) {
            alert('Error logging stock');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { id: 'INTERNAL_USE', label: 'Internal Use', icon: ActivitySquare },
        { id: 'PURCHASE_IN', label: 'Purchase In', icon: Plus },
        { id: 'RETURN', label: 'Return', icon: RotateCcw },
        { id: 'EXPIRED_DISPOSED', label: 'Expired / Disposed', icon: Trash2 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Log Stock: {stock.itemName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{stock.itemCode}</span>
                            <span className="text-sm text-slate-500">Current Stock: <strong className="text-slate-700">{stock.quantityAvail}</strong></span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {types.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setMovementType(t.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${movementType === t.id
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <t.icon className={`w-5 h-5 ${movementType === t.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className="text-xs font-bold text-center leading-tight">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <form id="log-stock-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-5 border-b border-slate-100 pb-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    min="0.01"
                                    step="0.01"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="e.g. 50"
                                />
                                {movementType !== 'PURCHASE_IN' && movementType !== 'RETURN' && (
                                    <p className="text-xs text-rose-500 mt-1 italic">This will decrease the stock</p>
                                )}
                                {(movementType === 'PURCHASE_IN' || movementType === 'RETURN') && (
                                    <p className="text-xs text-emerald-600 mt-1 italic">This will increase the stock</p>
                                )}
                            </div>

                            {['PURCHASE_IN', 'RETURN', 'EXPIRED_DISPOSED'].includes(movementType) && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch No</label>
                                    <input
                                        type="text"
                                        value={batchNo}
                                        onChange={e => setBatchNo(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono"
                                        placeholder="e.g. BATCH-001"
                                    />
                                </div>
                            )}
                        </div>

                        {movementType === 'PURCHASE_IN' && (
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor <span className="text-rose-500">*</span></label>
                                    <select
                                        required
                                        value={vendorId}
                                        onChange={e => setVendorId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {movementType === 'RETURN' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="e.g. Defective part"
                                />
                            </div>
                        )}

                        {movementType === 'INTERNAL_USE' && (
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign Patient (UUID)</label>
                                    <input
                                        type="text"
                                        value={assignPatientId}
                                        onChange={e => setAssignPatientId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono text-xs"
                                        placeholder="Optional Patient ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign Staff (UUID)</label>
                                    <input
                                        type="text"
                                        value={assignStaffId}
                                        onChange={e => setAssignStaffId(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono text-xs"
                                        placeholder="Optional Staff ID"
                                    />
                                </div>
                            </div>
                        )}

                        {['RETURN', 'INTERNAL_USE', 'EXPIRED_DISPOSED'].includes(movementType) && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows="2"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                                    placeholder="Add any additional context..."
                                />
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="log-stock-form"
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                    >
                        {loading ? 'Logging...' : 'Confirm Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
