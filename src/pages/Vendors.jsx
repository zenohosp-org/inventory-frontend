import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Vendors() {
    const { getAuthHeaders } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/inventory/vendors', { headers: getAuthHeaders() });
            setVendors(res.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/vendors', {
                name, contactName, phone, isActive: true, suppliesInventory: true
            }, { headers: getAuthHeaders() });
            
            setName('');
            setContactName('');
            setPhone('');
            fetchVendors();
        } catch (error) {
            console.error('Error creating vendor:', error);
            alert('Failed to create vendor');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-600" />
                Vendors Master
            </h1>

            <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 mb-8 flex gap-4 items-end">
                <div className="flex-1">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor Name</label>
                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                </div>
                <div className="flex-1">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Person</label>
                     <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                </div>
                <div className="flex-1">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                     <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                </div>
                <button onClick={handleCreate} disabled={!name.trim()} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2">
                     <Plus className="w-4 h-4" /> Add Vendor
                 </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100">Vendor Name</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Contact Person</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="3" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : vendors.length === 0 ? (
                            <tr><td colSpan="3" className="p-8 text-center text-slate-500">No vendors found.</td></tr>
                        ) : (
                            vendors.map(vendor => (
                                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900">{vendor.name}</td>
                                    <td className="p-4 text-slate-600">{vendor.contactName || '-'}</td>
                                    <td className="p-4 text-slate-600">{vendor.phone || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
