import { useState, useEffect } from 'react';
import { Package, Search, AlertCircle } from 'lucide-react';
import LogStockModal from '../components/LogStockModal';
import ReceiveQuantityModal from '../components/ReceiveQuantityModal';
import { getStockOverview, getCategories, getPurchaseOrders } from '../api/client';


export default function StockOverview() {
    const [stocks, setStocks] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('Fetching stock overview and purchase orders...');
            const [stockRes, catRes, poRes] = await Promise.all([
                getStockOverview(),
                getCategories(),
                getPurchaseOrders(),
            ]);
            console.log('Stock Response:', stockRes);
            console.log('Categories Response:', catRes);
            console.log('Purchase Orders Response:', poRes);
            
            let stocksData = stockRes.data || stockRes;
            let categoriesData = catRes.data || catRes;
            let posData = poRes.data || poRes;
            if (typeof stocksData === 'string') stocksData = JSON.parse(stocksData);
            if (typeof categoriesData === 'string') categoriesData = JSON.parse(categoriesData);
            if (typeof posData === 'string') posData = JSON.parse(posData);
            stocksData = Array.isArray(stocksData) ? stocksData : [];
            categoriesData = Array.isArray(categoriesData) ? categoriesData : [];
            posData = Array.isArray(posData) ? posData : [];
            
            console.log('Parsed stocks:', stocksData);
            console.log('Parsed categories:', categoriesData);
            console.log('Parsed purchase orders:', posData);
            
            setStocks(stocksData);
            setCategories(categoriesData);
            setPurchaseOrders(posData);
            
            if (stocksData.length === 0) {
                console.warn('No stock data returned from API');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error details:', error.response?.data || error.message);
            setStocks([]);
            setCategories([]);
            setPurchaseOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateIncomingQty = (stock) => {
        let incomingQty = 0;
        // Find all open POs for this store and item
        purchaseOrders.forEach(po => {
            if (!po.isFullyReceived && po.store?.id === stock.storeId) {
                po.items?.forEach(poItem => {
                    if (poItem.inventoryItem?.id === stock.itemId) {
                        const remaining = parseFloat(poItem.quantity) - (parseFloat(poItem.receivedQty) || 0);
                        incomingQty += remaining;
                    }
                });
            }
        });
        return incomingQty;
    };

    const getPOsForStock = (stock) => {
        return purchaseOrders.filter(po => 
            !po.isFullyReceived && po.store?.id === stock.storeId && 
            po.items?.some(item => item.inventoryItem?.id === stock.itemId)
        );
    };

    const handleLogStockClick = (stock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleReleaseClick = (po) => {
        setSelectedPO(po);
        setShowReceiveModal(true);
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

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <Package size={26} />
                    Stock Overview
                </h1>
                <p className="page-subtitle">
                    Monitor current inventory levels, incoming stock from POs, and manage receipts.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-bar-input"
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
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : filteredStocks.length === 0 ? (
                        <div className="table-empty">
                            <div>
                                <p>No stock records found.</p>
                                <p className="text-xs">Create inventory items and purchase orders to populate stock data.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/purchase-orders'}>
                                    Go to Purchase Orders
                                </button>
                            </div>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Current</th>
                                    <th>Incoming</th>
                                    <th>Min Level</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStocks.map((stock, idx) => {
                                    const incomingQty = calculateIncomingQty(stock);
                                    const pos = getPOsForStock(stock);
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <span className="mono-sm">{stock.itemCode || '-'}</span>
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
                                                <strong className={
                                                    stock.quantityAvail <= stock.reorderLevel ? 'text-danger' :
                                                    stock.quantityAvail <= stock.reorderLevel * 1.5 ? 'text-warning' :
                                                    'text-success'
                                                }>
                                                    {stock.quantityAvail}
                                                </strong>
                                            </td>
                                            <td>
                                                {incomingQty > 0 ? (
                                                    <span className="text-primary fw-semibold">+{incomingQty.toFixed(2)}</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
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
                                                <div className="action-group">
                                                    {pos.length > 0 && (
                                                        <button
                                                            onClick={() => handleReleaseClick(pos[0])}
                                                            className="btn btn-sm btn-secondary"
                                                            title="Record receipt from PO"
                                                        >
                                                            Release
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleLogStockClick(stock)}
                                                        className="btn btn-sm btn-primary"
                                                        title="Log stock transaction"
                                                    >
                                                        Log
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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

            {showReceiveModal && selectedPO && (
                <ReceiveQuantityModal
                    po={selectedPO}
                    onClose={() => {
                        setShowReceiveModal(false);
                        setSelectedPO(null);
                    }}
                    onSuccess={() => {
                        fetchData();
                        setShowReceiveModal(false);
                        setSelectedPO(null);
                    }}
                />
            )}
        </div>
    );
}
