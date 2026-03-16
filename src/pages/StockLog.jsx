import { useState, useEffect } from 'react';
import axios from 'axios';
import { History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StockLog() {
    const { getAuthHeaders } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/inventory/stock-transactions', { headers: getAuthHeaders() });
            setTransactions(res.data);
        } catch (error) {
            console.error('Error fetching stock log:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-6 h-6 text-emerald-600" />
                Stock Log (Transactions)
            </h1>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b border-slate-100 w-40">Date</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Product</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Type</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-right w-24">Qty</th>
                            <th className="p-4 font-semibold border-b border-slate-100 text-right w-24">Balance</th>
                            <th className="p-4 font-semibold border-b border-slate-100">Reference / Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">No stock transactions found.</td></tr>
                        ) : (
                            transactions.map(txn => (
                                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-slate-500">{new Date(txn.createdAt).toLocaleString()}</td>
                                    <td className="p-4 font-medium text-slate-900">{txn.item?.name || 'Unknown Item'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${txn.quantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {txn.transactionType}
                                        </span>
                                    </td>
                                    <td className={`p-4 text-right font-bold ${txn.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                    </td>
                                    <td className="p-4 text-right font-semibold text-slate-700">{txn.balanceAfter}</td>
                                    <td className="p-4 text-slate-600">
                                        {txn.referenceType && <span className="font-semibold text-slate-500">[{txn.referenceType}] </span>}
                                        {txn.remarks || '-'}
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
