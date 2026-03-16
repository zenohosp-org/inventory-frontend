import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InventoryItems() {
    const { getAuthHeaders } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [unit, setUnit] = useState('Piece');
    const [reorderLevel, setReorderLevel] = useState(5);
    const [preferredVendorId, setPreferredVendorId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catsRes, vendsRes] = await Promise.all([
                axios.get('/api/inventory/items', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/categories', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/vendors', { headers: getAuthHeaders() })
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setVendors(vendsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/items', {
                name, code, categoryId, unit, reorderLevel, preferredVendorId, isActive: true
            }, { headers: getAuthHeaders() });

            setName('');
            setCode('');
            setCategoryId('');
            setUnit('Piece');
            setReorderLevel(5);
            setPreferredVendorId('');
            fetchData();
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to create product');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-600" />
                Product List (Inventory Items)
            </h1>

            <form onSubmit={handleCreate} className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 mb-8 flex flex-col gap-4">
                <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Name <span className="text-rose-500">*</span></label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code</label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Group <span className="text-rose-500">*</span></label>
                        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                            <option value="">Select Group</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">UoM</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                            <option value="Piece">Piece</option>
                            <option value="Box">Box</option>
                            <option value="Roll">Roll</option>
                            <option value="Kg">Kg</option>
                            <option value="Litre">Litre</option>
                            <option value="Pack">Pack</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Level</label>
                        <input type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Vendor</label>
                        <select value={preferredVendorId} onChange={(e) => setPreferredVendorId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium">
                            <option value="">Select Vendor (Optional)</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <button type="submit" disabled={!name.trim() || !categoryId} className="w-full px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Product
                        </button>
                    </div>
                </div>
            </form>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100 w-24">Code</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Product Name</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Group</th>
                            <th className="p-4 font-semibold border-b border-slate-100">UoM</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-right">Min Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">No products found.</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-mono text-slate-500">{item.code || '-'}</td>
                                    <td className="p-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="p-4 text-slate-600">{categories.find(c => c.id === item.categoryId)?.name || '-'}</td>
                                    <td className="p-4 text-slate-600">{item.unit}</td>
                                    <td className="p-4 text-right">{item.reorderLevel}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
