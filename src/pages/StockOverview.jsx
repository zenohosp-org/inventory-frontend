import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import LogStockModal from './LogStockModal';
import { getStockOverview, getCategories } from '../api/client';


export default function StockOverview() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stockRes, catRes] = await Promise.all([
                getStockOverview(),
                getCategories(),
            ]);
            setStocks(stockRes.data || []);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
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
        if (refresh) fetchData();
    };

    const filteredStocks = stocks.filter(s => {
        const matchesSearch = (s.itemName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (s.itemCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || s.categoryId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getStockColor = (quantity, minLevel) => {
        if (quantity <= minLevel) return 'var(--color-error)';
        if (quantity <= minLevel * 1.5) return 'var(--color-warning)';
        return 'var(--color-success)';
    };

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <Package size={28} style={{ color: 'var(--color-accent)' }} />
                    Stock Overview
                </h1>
                <p className="page-subtitle">
                    Monitor current inventory levels across all stores and departments.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group" style={{ flex: 1 }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                        <Search size={18} style={{ color: 'var(--color-gray-500)' }} />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="filter-input"
                            style={{ backgroundColor: 'transparent', border: 'none', flex: 1 }}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stock Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Products ({filteredStocks.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : filteredStocks.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No stock records found.
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '12%' }}>Code</th>
                                    <th style={{ width: '25%' }}>Product Name</th>
                                    <th style={{ width: '18%' }}>Category</th>
                                    <th style={{ width: '12%' }}>Current</th>
                                    <th style={{ width: '12%' }}>Min Level</th>
                                    <th style={{ width: '12%' }}>Status</th>
                                    <th style={{ width: '9%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map((stock, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-gray-600)' }}>
                                                {stock.itemCode || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{stock.itemName}</strong>
                                        </td>
                                        <td>
                                            {stock.categoryName ? (
                                                <span className="badge badge-primary">
                                                    {stock.categoryName}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <strong style={{ color: getStockColor(stock.quantityAvail, stock.reorderLevel) }}>
                                                {stock.quantityAvail}
                                            </strong>
                                        </td>
                                        <td>{stock.reorderLevel}</td>
                                        <td>
                                            {stock.quantityAvail <= stock.reorderLevel ? (
                                                <span className="badge badge-error">Low Stock</span>
                                            ) : stock.quantityAvail <= stock.reorderLevel * 1.5 ? (
                                                <span className="badge badge-warning">Caution</span>
                                            ) : (
                                                <span className="badge badge-success">Optimal</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleLogStockClick(stock)}
                                                className="btn btn-sm btn-primary"
                                                title="Log stock transaction"
                                            >
                                                Log
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span className="table-info">
                        Showing {filteredStocks.length} of {stocks.length} products
                    </span>
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
