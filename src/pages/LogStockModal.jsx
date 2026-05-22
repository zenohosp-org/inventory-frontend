import { useState, useEffect } from 'react';
import { X, Plus, ActivitySquare, Trash2 } from 'lucide-react';
import { getVendors, getStores, logStock } from '../api/client';
import SearchableSelect from '../components/SearchableSelect';


export default function LogStockModal({ stock, onClose, onSuccess }) {
    const [movementType, setMovementType] = useState('INTERNAL_USE');

    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    // "Purchase In" Specific
    const [vendorId, setVendorId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [batchNo, setBatchNo] = useState('');

    // "Internal Use" Specific
    const [locationStoreId, setLocationStoreId] = useState('');
    const [staffName, setStaffName] = useState('');
    const [department, setDepartment] = useState('');

    // Options
    const [vendors, setVendors] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (movementType === 'PURCHASE_IN') {
            fetchVendors();
        }
        if (movementType === 'INTERNAL_USE') {
            fetchStores();
        }
    }, [movementType]);

    const fetchVendors = async () => {
        try {
            const res = await getVendors();
            let data = res.data || res;
            if (typeof data === 'string') data = JSON.parse(data);
            setVendors(Array.isArray(data) ? data : []);
        } catch {
            setVendors([]);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await getStores();
            let data = res.data || res;
            if (typeof data === 'string') data = JSON.parse(data);
            setStores(Array.isArray(data) ? data : []);
        } catch {
            setStores([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!quantity || quantity <= 0) {
            alert('Enter a valid quantity');
            return;
        }

        if (movementType === 'PURCHASE_IN' && !vendorId) {
            alert('Please select a vendor for Purchase In transactions');
            return;
        }

        setLoading(true);

        const payload = {
            movementType,
            storeId: stock.storeId,
            itemId: stock.itemId,
            quantity: Number(quantity),

            vendorId: movementType === 'PURCHASE_IN' ? vendorId : null,
            expiryDate: movementType === 'PURCHASE_IN' ? expiryDate : null,
            batchNo: ['PURCHASE_IN', 'EXPIRED_DISPOSED'].includes(movementType) ? batchNo : null,

            locationStoreId: movementType === 'INTERNAL_USE' ? locationStoreId || null : null,
            staffName: movementType === 'INTERNAL_USE' ? staffName || null : null,
            department: movementType === 'INTERNAL_USE' ? department || null : null,

            notes: notes || null,
        };

        try {
            await logStock(payload);
            alert('Stock transaction recorded successfully!');
            onSuccess();
        } catch (error) {
            alert('Error logging stock: ' + (error.response?.data?.message || error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { id: 'INTERNAL_USE', label: 'Internal Use', icon: ActivitySquare },
        { id: 'PURCHASE_IN', label: 'Purchase In', icon: Plus },
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
                    <div className="grid grid-cols-3 gap-3 mb-8">
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
                                {movementType === 'PURCHASE_IN' && (
                                    <p className="text-xs text-emerald-600 mt-1 italic">This will increase the stock</p>
                                )}
                                {movementType !== 'PURCHASE_IN' && (
                                    <p className="text-xs text-rose-500 mt-1 italic">This will decrease the stock</p>
                                )}
                            </div>

                            {['PURCHASE_IN', 'EXPIRED_DISPOSED'].includes(movementType) && (
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
                                    <SearchableSelect
                                        value={vendorId}
                                        onChange={setVendorId}
                                        options={vendors}
                                        getId={v => v.id}
                                        getLabel={v => v.name}
                                        placeholder="Select Vendor"
                                        required
                                    />
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

                        {movementType === 'INTERNAL_USE' && (
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location (Store)</label>
                                    <SearchableSelect
                                        value={locationStoreId}
                                        onChange={setLocationStoreId}
                                        options={stores}
                                        getId={s => s.id}
                                        getLabel={s => s.name}
                                        placeholder="Select store..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff</label>
                                    <input
                                        type="text"
                                        value={staffName}
                                        onChange={e => setStaffName(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                        placeholder="Staff name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                        placeholder="e.g. ICU, OPD"
                                    />
                                </div>
                            </div>
                        )}

                        {['INTERNAL_USE', 'EXPIRED_DISPOSED'].includes(movementType) && (
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
                    <button type="button" onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="log-stock-form"
                        disabled={loading || !quantity}
                        className="btn btn-success"
                    >
                        {loading ? 'Processing...' : 'Confirm Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
