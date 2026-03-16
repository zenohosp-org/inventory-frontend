import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PurchaseOrders() {
    const { getAuthHeaders } = useAuth();
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [isCreating, setIsCreating] = useState(false);
    const [vendorId, setVendorId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [poItems, setPoItems] = useState([{ itemId: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [posRes, vendsRes, itemsRes] = await Promise.all([
                axios.get('/api/inventory/purchase-orders', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/vendors', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/items', { headers: getAuthHeaders() })
            ]);
            setPos(posRes.data);
            setVendors(vendsRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setPoItems([...poItems, { itemId: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...poItems];
        newItems[index][field] = value;
        setPoItems(newItems);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/purchase-orders', {
                vendorId,
                expectedDate,
                items: poItems.filter(i => i.itemId && i.quantity > 0)
            }, { headers: getAuthHeaders() });

            setIsCreating(false);
            setVendorId('');
            setExpectedDate('');
            setPoItems([{ itemId: '', quantity: 1, unitPrice: 0 }]);
            fetchData();
        } catch (error) {
            console.error('Error creating PO:', error);
            alert('Failed to create Purchase Order');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                    Purchase Orders
                </h1>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New PO
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-lg overflow-hidden p-6 mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Create Purchase Order</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Supplier <span className="text-rose-500">*</span></label>
                                <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                                    <option value="">Select Supplier</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expected Delivery Date <span className="text-rose-500">*</span></label>
                                <input required type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Line Items</label>
                            {poItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="col-span-6">
                                        <select required value={item.itemId} onChange={(e) => handleItemChange(index, 'itemId', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                                            <option value="">Select Product...</option>
                                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                                            <span className="px-3 text-slate-400 text-xs font-semibold bg-slate-50 border-r border-slate-200">Qty</span>
                                            <input required type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-full px-3 py-2 focus:outline-none font-medium text-slate-700" />
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                                            <span className="px-3 text-slate-400 text-xs font-semibold bg-slate-50 border-r border-slate-200">Price ₹</span>
                                            <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))} className="w-full px-3 py-2 focus:outline-none font-medium text-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddItem} className="text-emerald-600 font-semibold hover:text-emerald-700 text-sm flex items-center gap-1 mt-2">
                                <Plus className="w-4 h-4" /> Add another item
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={!vendorId || !expectedDate || poItems.length === 0} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-sm">
                                Create PO
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100 w-32">PO Number</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Supplier</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Ordered Date</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Expected Delivery</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-center w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : pos.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">No purchase orders found.</td></tr>
                        ) : (
                            pos.map(po => (
                                <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-mono text-emerald-700 font-bold">{po.poNumber}</td>
                                    <td className="p-4 font-medium text-slate-900">{po.vendor?.name || 'Unknown'}</td>
                                    <td className="p-4 text-slate-600">{new Date(po.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-slate-600">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${po.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
