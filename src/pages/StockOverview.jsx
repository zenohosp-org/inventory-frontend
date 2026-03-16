import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Plus, Search, LogIn, LogOut, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogStockModal from './LogStockModal';

export default function StockOverview() {
    const { getAuthHeaders } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    useEffect(() => {
        fetchStockOverview();
    }, []);

    const fetchStockOverview = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/inventory/stock-overview', { headers: getAuthHeaders() });
            setStocks(res.data);
        } catch (error) {
            console.error('Error fetching stock overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogStockClick = (stock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleModalClose = (refresh) => {
        setIsModalOpen(false);
        setSelectedStock(null);
        if (refresh) fetchStockOverview();
    };

    const filteredStocks = stocks.filter(s =>
        (s.itemName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.itemCode?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Box className="w-6 h-6 text-emerald-600" />
                        Stock Overview
                    </h1>
                    <p className="text-slate-500 mt-1">Manage and track your inventory levels</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b border-slate-100">Code</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Product</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Group</th>
                                <th className="p-4 font-semibold border-b border-slate-100 text-right">Stock</th>
                                <th className="p-4 font-semibold border-b border-slate-100 text-right">Min Level</th>
                                <th className="p-4 font-semibold border-b border-slate-100 w-32 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading stock data...</td>
                                </tr>
                            ) : filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No stock records found</td>
                                </tr>
                            ) : (
                                filteredStocks.map(stock => (
                                    <tr key={stock.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-mono text-slate-600">{stock.itemCode || '-'}</td>
                                        <td className="p-4 font-medium text-slate-900">{stock.itemName}</td>
                                        <td className="p-4 text-slate-600">{stock.categoryName || '-'}</td>
                                        <td className="p-4 text-right">
                                            <span className={`font-semibold ${stock.quantityAvail <= stock.reorderLevel ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {stock.quantityAvail}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-slate-500">{stock.reorderLevel}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleLogStockClick(stock)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Log Stock
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && selectedStock && (
                <LogStockModal
                    stock={selectedStock}
                    onClose={() => handleModalClose(false)}
                    onSuccess={() => handleModalClose(true)}
                />
            )}
        </div>
    );
}
