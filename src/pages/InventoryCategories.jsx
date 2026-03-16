import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InventoryCategories() {
    const { getAuthHeaders } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/inventory/categories', { headers: getAuthHeaders() });
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/categories', { name, isActive: true }, { headers: getAuthHeaders() });
            setName('');
            fetchCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            alert('Failed to create category');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-emerald-600" />
                Product Groups (Categories)
            </h1>

            <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 mb-8 flex gap-4 items-end">
                <div className="flex-1">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Group Name</label>
                     <input
                         type="text"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                         placeholder="e.g. Surgical Tools"
                     />
                </div>
                <button 
                     onClick={handleCreate}
                     disabled={!name.trim()}
                     className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
                 >
                     <Plus className="w-4 h-4" /> Add Group
                 </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100">Group Name</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-center w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="2" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="2" className="p-8 text-center text-slate-500">No product groups found.</td></tr>
                        ) : (
                            categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900">{cat.name}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cat.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {cat.isActive !== false ? 'Active' : 'Inactive'}
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
