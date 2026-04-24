import { useState, useEffect } from 'react';
import { Package, Search, Tag, X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, RotateCcw, Trash2, Wrench } from 'lucide-react';
import LogStockModal from '../components/LogStockModal';
import ReceiveQuantityModal from '../components/ReceiveQuantityModal';
import { getStockOverview, getCategories, getPurchaseOrders, logStock, getStockLogs, createAsset, getAssets, getVendors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './StockOverview.css';

const TXN_TYPE = {
    PURCHASE_IN:      { label: 'Purchase In',   color: '#16a34a', bg: '#dcfce7' },
    TRANSFER_IN:      { label: 'Transfer In',   color: '#0891b2', bg: '#cffafe' },
    TRANSFER_OUT:     { label: 'Transfer Out',  color: '#6366f1', bg: '#e0e7ff' },
    RETURN:           { label: 'Return',        color: '#d97706', bg: '#fef3c7' },
    INTERNAL_USE:     { label: 'Internal Use',  color: '#2563eb', bg: '#dbeafe' },
    EXPIRED_DISPOSED: { label: 'Disposed',      color: '#dc2626', bg: '#fee2e2' },
    ASSET_OUT:        { label: 'Asset Out',     color: '#7c3aed', bg: '#ede9fe' },
};

const ASSET_FORM_EMPTY = {
    assetName: '', assetCode: '', serialNumber: '', make: '', model: '',
    purchaseDate: '', purchasePrice: '', location: '', notes: '', quantity: '',
};

export default function StockOverview() {
    const { user } = useAuth();
    const [stocks, setStocks] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [assetLogs, setAssetLogs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterVendor, setFilterVendor] = useState('all');
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState('stock'); // 'stock' | 'assets'

    // Log stock modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    // Receive modal
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);

    // Stock detail panel
    const [panelStock, setPanelStock] = useState(null);
    const [stockLogs, setStockLogs] = useState([]);

    // Label as asset modal
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [assetStock, setAssetStock] = useState(null);
    const [assetForm, setAssetForm] = useState(ASSET_FORM_EMPTY);
    const [assetSubmitting, setAssetSubmitting] = useState(false);
    const [assetError, setAssetError] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stockRes, catRes, poRes, logsRes, assetsRes, vendsRes] = await Promise.all([
                getStockOverview(),
                getCategories(),
                getPurchaseOrders(),
                getStockLogs(),
                getAssets().catch(() => ({ data: [] })),
                getVendors().catch(() => ({ data: [] })),
            ]);
            setStocks(Array.isArray(stockRes.data) ? stockRes.data : []);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setPurchaseOrders(Array.isArray(poRes.data) ? poRes.data : []);
            const allLogs = Array.isArray(logsRes.data) ? logsRes.data : [];
            setStockLogs(allLogs);
            setAssetLogs(allLogs.filter(t => t.transactionType === 'ASSET_OUT'));
            setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
            setVendors(Array.isArray(vendsRes.data) ? vendsRes.data : []);
        } catch {
            setStocks([]); setCategories([]); setPurchaseOrders([]); setStockLogs([]); setAssetLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateIncomingQty = (stock) => {
        let incomingQty = 0;
        purchaseOrders.forEach(po => {
            const isOpen = po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';
            if (isOpen && po.store?.id === stock.storeId) {
                po.items?.forEach(poItem => {
                    if (poItem.inventoryItem?.id === stock.itemId) {
                        const remaining = parseFloat(poItem.quantity) - (parseFloat(poItem.receivedQty) || 0);
                        if (remaining > 0) incomingQty += remaining;
                    }
                });
            }
        });
        return incomingQty;
    };

    const handleLogStockClick = (stock) => { setSelectedStock(stock); setIsModalOpen(true); };
    const handleReleaseClick = (po) => { setSelectedPO(po); setShowReceiveModal(true); };
    const handleModalClose = (refresh) => { setIsModalOpen(false); setSelectedStock(null); if (refresh) fetchData(); };

    const openAssetModal = (stock) => {
        const prefix = (stock.itemName || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
        const existing = assets.filter(a => a.assetCode?.startsWith(prefix + '-'));
        const assetCode = prefix ? `${prefix}-${String(existing.length + 1).padStart(3, '0')}` : '';
        setAssetStock(stock);
        setAssetForm({ ...ASSET_FORM_EMPTY, assetName: stock.itemName || '', assetCode, quantity: '1' });
        setAssetError('');
        setShowAssetModal(true);
    };

    const af = (k) => (e) => setAssetForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleAssetSubmit = async (e) => {
        e.preventDefault();
        if (!assetForm.assetName.trim()) { setAssetError('Asset name is required'); return; }
        if (!assetForm.assetCode.trim()) { setAssetError('Asset code is required (must be unique)'); return; }
        const qty = Number(assetForm.quantity);
        if (!qty || qty <= 0) { setAssetError('Quantity must be greater than 0'); return; }
        if (qty > Number(assetStock.quantityAvail)) {
            setAssetError(`Cannot exceed available stock (${assetStock.quantityAvail})`);
            return;
        }

        setAssetSubmitting(true);
        setAssetError('');
        try {
            // 1. Create asset record in asset-manager
            await createAsset({
                assetName: assetForm.assetName,
                assetCode: assetForm.assetCode,
                serialNumber: assetForm.serialNumber || null,
                make: assetForm.make || null,
                model: assetForm.model || null,
                purchaseDate: assetForm.purchaseDate || null,
                purchasePrice: assetForm.purchasePrice ? Number(assetForm.purchasePrice) : null,
                location: assetForm.location || null,
                notes: assetForm.notes || null,
                description: `Labeled from inventory: ${assetStock.itemName}${assetStock.itemCode ? ' (' + assetStock.itemCode + ')' : ''}`,
                status: 'ACTIVE',
            }, user?.token);

            // 2. Deduct from inventory stock
            await logStock({
                movementType: 'ASSET_OUT',
                storeId: assetStock.storeId,
                itemId: assetStock.itemId,
                quantity: qty,
                notes: `Labeled as asset: ${assetForm.assetCode}`,
            });

            setShowAssetModal(false);
            fetchData();
        } catch (err) {
            setAssetError(err.response?.data?.message || err.response?.data || 'Failed to label as asset. Check asset code uniqueness.');
        } finally {
            setAssetSubmitting(false);
        }
    };

    const filteredStocks = stocks.filter(s => {
        const matchesSearch = (s.itemName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                              (s.itemCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || s.categoryId === filterCategory;
        const matchesVendor = filterVendor === 'all' || s.vendorId === filterVendor;
        return matchesSearch && matchesCategory && matchesVendor;
    });

    const filteredAssetLogs = assetLogs.filter(t =>
        (t.itemName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title"><Package size={26} /> Stock Overview</h1>
                <p className="page-subtitle">Monitor inventory levels and label items as assets.</p>
            </div>

            {/* View toggle */}
            <div className="so-view-toggle">
                <button
                    className={`btn btn-sm ${view === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('stock')}
                >
                    <Package size={14} /> Stock
                </button>
                <button
                    className={`btn btn-sm ${view === 'assets' ? 'btn-asset' : 'btn-secondary'}`}
                    onClick={() => setView('assets')}
                >
                    <Tag size={14} /> Sent to Assets {assetLogs.length > 0 && `(${assetLogs.length})`}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder={view === 'stock' ? 'Search by product name or code...' : 'Search by item name...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
                {view === 'stock' && (
                    <>
                        <div className="filter-group">
                            <label className="filter-label">Category</label>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                                <option value="all">All Categories</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Vendor</label>
                            <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="filter-select">
                                <option value="all">All Vendors</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* Stock Table + Detail Panel */}
            {view === 'stock' && (
                <div className="so-layout">
                    <div className="table-container so-table-wrap">
                        <div className="table-header">
                            <h3 className="table-title">Products ({filteredStocks.length})</h3>
                            <span className="text-muted so-hint">Click a row to see transactions</span>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div className="table-empty"><div className="spinner"></div></div>
                            ) : filteredStocks.length === 0 ? (
                                <div className="table-empty">
                                    <p>No stock records found.</p>
                                    <p className="text-xs">Create inventory items and purchase orders to populate stock data.</p>
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
                                            const isSelected = panelStock?.itemId === stock.itemId && panelStock?.storeId === stock.storeId;
                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`so-row${isSelected ? ' so-row-selected' : ''}`}
                                                    onClick={() => setPanelStock(isSelected ? null : stock)}
                                                >
                                                    <td><span className="mono-sm">{stock.itemCode || '-'}</span></td>
                                                    <td><strong>{stock.itemName}</strong></td>
                                                    <td>
                                                        {stock.categoryName
                                                            ? <span className="badge badge-primary">{stock.categoryName}</span>
                                                            : '-'}
                                                    </td>
                                                    <td>
                                                        <strong className={
                                                            stock.quantityAvail <= stock.reorderLevel ? 'text-danger' :
                                                            stock.quantityAvail <= stock.reorderLevel * 1.5 ? 'text-warning' :
                                                            'text-success'
                                                        }>{stock.quantityAvail}</strong>
                                                    </td>
                                                    <td>
                                                        {incomingQty > 0
                                                            ? <span className="text-primary fw-semibold">+{Math.round(incomingQty)}</span>
                                                            : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td>{stock.reorderLevel}</td>
                                                    <td>
                                                        {stock.quantityAvail <= stock.reorderLevel
                                                            ? <span className="badge badge-error">Low Stock</span>
                                                            : stock.quantityAvail <= stock.reorderLevel * 1.5
                                                            ? <span className="badge badge-warning">Caution</span>
                                                            : <span className="badge badge-success">Optimal</span>}
                                                    </td>
                                                    <td onClick={e => e.stopPropagation()}>
                                                        <div className="action-group">
                                                            <button onClick={() => handleLogStockClick(stock)} className="btn btn-sm btn-primary" title="Log stock transaction">
                                                                Log
                                                            </button>
                                                            <button
                                                                onClick={() => openAssetModal(stock)}
                                                                className="btn btn-sm btn-asset"
                                                                title="Label as asset"
                                                            >
                                                                <Tag size={13} /> Asset
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
                            <span className="table-info">Showing {filteredStocks.length} of {stocks.length} products</span>
                        </div>
                    </div>

                    {/* Stock Detail Panel */}
                    {panelStock && (() => {
                        const panelLogs = stockLogs.filter(
                            t => t.itemId === panelStock.itemId && t.storeId === panelStock.storeId
                        );
                        const stockLow = panelStock.quantityAvail <= panelStock.reorderLevel;
                        return (
                            <div className="so-panel">
                                <div className="so-panel-header">
                                    <div>
                                        <div className="so-panel-name">{panelStock.itemName}</div>
                                        <div className="so-panel-meta">{panelStock.storeName || 'Store'} · {panelStock.itemCode || ''}</div>
                                        <div className="so-panel-stats">
                                            <div>
                                                <div className="so-stat-label">In Stock</div>
                                                <div className={`so-stat-value ${stockLow ? 'so-stat-value--low' : 'so-stat-value--ok'}`}>
                                                    {panelStock.quantityAvail}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="so-stat-label">Incoming</div>
                                                <div className="so-stat-value so-stat-value--incoming">+{Math.round(calculateIncomingQty(panelStock))}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="so-panel-close" onClick={() => setPanelStock(null)}>
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="so-txn-heading">
                                    Transactions ({panelLogs.length})
                                </div>
                                <div className="so-txn-scroll">
                                    {panelLogs.length === 0 ? (
                                        <div className="so-txn-empty">No transactions yet</div>
                                    ) : panelLogs.map((log, i) => {
                                        const t = TXN_TYPE[log.transactionType] || { label: log.transactionType, color: '#6b7280', bg: '#f3f4f6' };
                                        const qty = Number(log.quantity);
                                        return (
                                            <div key={log.id || i} className="so-txn-row">
                                                <div className="so-txn-body">
                                                    <div className="so-txn-top">
                                                        <span
                                                            className="so-txn-badge"
                                                            style={{ color: t.color, background: t.bg }}
                                                        >
                                                            {t.label}
                                                        </span>
                                                        <span className={`so-txn-qty ${qty >= 0 ? 'so-txn-qty--pos' : 'so-txn-qty--neg'}`}>
                                                            {qty >= 0 ? '+' : ''}{qty}
                                                        </span>
                                                    </div>
                                                    <div className="so-txn-date">
                                                        {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        {log.balanceAfter != null && <span> · Bal: {log.balanceAfter}</span>}
                                                    </div>
                                                    {log.remarks && <div className="so-txn-remarks">{log.remarks}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Sent to Assets view */}
            {view === 'assets' && (
                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title so-assets-title">Sent to Assets ({filteredAssetLogs.length})</h3>
                    </div>
                    <div className="table-body">
                        {loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : filteredAssetLogs.length === 0 ? (
                            <div className="table-empty">No stock labeled as assets yet. Click "Asset" on any stock row.</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Item</th>
                                        <th className="text-right">Qty Sent</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssetLogs.map((log, idx) => (
                                        <tr key={log.id || idx}>
                                            <td className="text-xs text-muted">
                                                {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td><strong>{log.itemName}</strong></td>
                                            <td className="text-right">
                                                <span className="so-asset-qty">
                                                    {Math.abs(Number(log.quantity))}
                                                </span>
                                            </td>
                                            <td className="text-muted">{log.remarks || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Log Stock modal */}
            {isModalOpen && selectedStock && (
                <LogStockModal
                    stock={selectedStock}
                    onClose={() => handleModalClose(false)}
                    onSuccess={() => handleModalClose(true)}
                />
            )}

            {/* Receive modal */}
            {showReceiveModal && selectedPO && (
                <ReceiveQuantityModal
                    po={selectedPO}
                    onClose={() => { setShowReceiveModal(false); setSelectedPO(null); }}
                    onSuccess={() => { fetchData(); setShowReceiveModal(false); setSelectedPO(null); }}
                />
            )}

            {/* Label as Asset modal */}
            {showAssetModal && assetStock && (
                <div className="modal-overlay active">
                    <div className="modal modal-md">
                        <div className="modal-header">
                            <h2 className="modal-title so-modal-title">
                                <Tag size={18} /> Label as Asset — {assetStock.itemName}
                            </h2>
                            <button className="modal-close" onClick={() => setShowAssetModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAssetSubmit}>
                            <div className="modal-body">
                                {assetError && <div className="alert alert-error">{assetError}</div>}
                                <div className="form-2col">
                                    <div className="form-group">
                                        <label className="form-label">Asset Name *</label>
                                        <input className="form-input" value={assetForm.assetName} onChange={af('assetName')} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Asset Code * <span className="text-muted so-label-hint">(must be unique)</span></label>
                                        <input className="form-input" value={assetForm.assetCode} onChange={af('assetCode')} placeholder="e.g. AST-0001" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quantity to Label * <span className="text-muted so-label-hint">(available: {assetStock.quantityAvail})</span></label>
                                        <input type="number" min="1" max={assetStock.quantityAvail} step="1" className="form-input" value={assetForm.quantity} onChange={af('quantity')} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Serial Number</label>
                                        <input className="form-input" value={assetForm.serialNumber} onChange={af('serialNumber')} placeholder="Optional" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Make</label>
                                        <input className="form-input" value={assetForm.make} onChange={af('make')} placeholder="Manufacturer" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Model</label>
                                        <input className="form-input" value={assetForm.model} onChange={af('model')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Date</label>
                                        <input type="date" className="form-input" value={assetForm.purchaseDate} onChange={af('purchaseDate')} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Purchase Price (₹)</label>
                                        <input type="number" min="0" step="0.01" className="form-input" value={assetForm.purchasePrice} onChange={af('purchasePrice')} placeholder="0.00" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input className="form-input" value={assetForm.location} onChange={af('location')} placeholder="Ward / Room / Floor" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notes</label>
                                        <input className="form-input" value={assetForm.notes} onChange={af('notes')} placeholder="Optional notes" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-purple"
                                    disabled={assetSubmitting}
                                >
                                    {assetSubmitting ? 'Labeling...' : 'Label as Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
