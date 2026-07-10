import { useState, useEffect } from 'react';
import { Package, Search, X, Layers, Edit3, Cpu } from 'lucide-react';
import LogStockModal from '../components/LogStockModal';
import ReceiveQuantityModal from '../components/ReceiveQuantityModal';
import { getStockOverview, getCategories, getPurchaseOrders, getStockLogs, getVendors, getStockBatches, getAssets } from '../api/client';
import { withCache } from '../cache';
import PageHeader from '../components/PageHeader';
import { stripHospitalPrefix } from '../utils/format';
import './StockOverview.css';

const TXN_TYPE = {
    PURCHASE_IN: { label: 'Purchase In', color: '#16a34a', bg: '#dcfce7' },
    TRANSFER_IN: { label: 'Transfer In', color: '#0891b2', bg: '#cffafe' },
    TRANSFER_OUT: { label: 'Transfer Out', color: '#6366f1', bg: '#e0e7ff' },
    RETURN: { label: 'Return', color: '#d97706', bg: '#fef3c7' },
    INTERNAL_USE: { label: 'Internal Use', color: '#2563eb', bg: '#dbeafe' },
    EXPIRED_DISPOSED: { label: 'Disposed', color: '#dc2626', bg: '#fee2e2' },
    ASSET_OUT: { label: 'Asset Out', color: '#7c3aed', bg: '#ede9fe' },
};

export default function StockOverview() {
    const [stocks, setStocks] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterVendor, setFilterVendor] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [categories, setCategories] = useState([]);

    // Log stock modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    // Receive modal
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);

    // Stock detail panel
    const [panelStock, setPanelStock] = useState(null);
    const [panelTab, setPanelTab] = useState('txns');
    const [stockLogs, setStockLogs] = useState([]);
    const [panelBatches, setPanelBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [panelAssetUnits, setPanelAssetUnits] = useState([]);
    const [assetUnitsLoading, setAssetUnitsLoading] = useState(false);

    const ASSET_STATUS = {
        ACTIVE:            { label: 'In Store',     cls: 'asset-status--store'  },
        IN_USE:            { label: 'In Use',        cls: 'asset-status--inuse'  },
        UNDER_MAINTENANCE: { label: 'Maintenance',   cls: 'asset-status--maint'  },
        RETIRED:           { label: 'Retired',       cls: 'asset-status--retired'},
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stockRes, catRes, poRes, logsRes, vendsRes] = await Promise.all([
                getStockOverview(),
                withCache('categories', getCategories),
                getPurchaseOrders(),
                getStockLogs(),
                withCache('vendors', getVendors).catch(() => ({ data: [] })),
            ]);
            setStocks(Array.isArray(stockRes.data) ? stockRes.data : []);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setPurchaseOrders(Array.isArray(poRes.data) ? poRes.data : []);
            setStockLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
            setVendors(Array.isArray(vendsRes.data) ? vendsRes.data : []);
        } catch {
            setStocks([]); setCategories([]); setPurchaseOrders([]); setStockLogs([]);
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

    const openPanel = (stock) => {
        const isSelected = panelStock?.itemId === stock.itemId && panelStock?.storeId === stock.storeId;
        if (isSelected) { setPanelStock(null); return; }
        setPanelStock(stock);
        setPanelBatches([]);
        setPanelAssetUnits([]);
        const initialTab = stock.billingGroup === 'ASSET' ? 'units' : 'txns';
        setPanelTab(initialTab);
        if (initialTab === 'units') loadAssetUnits(stock);
    };

    const loadAssetUnits = async (stock) => {
        setAssetUnitsLoading(true);
        try {
            const res = await getAssets({ sourceItemId: stock.itemId });
            setPanelAssetUnits(Array.isArray(res.data) ? res.data : []);
        } catch { setPanelAssetUnits([]); }
        finally { setAssetUnitsLoading(false); }
    };

    const handlePanelTab = async (tab) => {
        setPanelTab(tab);
        if (tab === 'batches' && panelStock && panelBatches.length === 0) {
            setBatchesLoading(true);
            try {
                const res = await getStockBatches(panelStock.storeId, panelStock.itemId);
                setPanelBatches(Array.isArray(res.data) ? res.data : []);
            } catch { setPanelBatches([]); }
            finally { setBatchesLoading(false); }
        }
        if (tab === 'units' && panelStock && panelAssetUnits.length === 0) {
            loadAssetUnits(panelStock);
        }
    };

    const filteredStocks = stocks.filter(s => {
        const matchesSearch = (s.itemName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (s.itemCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || s.categoryId === filterCategory;
        const matchesVendor = filterVendor === 'all' || s.vendorId === filterVendor;
        const isAsset = s.billingGroup === 'ASSET';
        const matchesType = filterType === 'all' || (filterType === 'asset' ? isAsset : !isAsset);
        return matchesSearch && matchesCategory && matchesVendor && matchesType;
    });

    return (
        <div className="main-content">
            <PageHeader 
                title={
                    <>
                        <Package size={26} /> Stock Overview
                    </>
                }
                subtitle="Monitor inventory levels and stock transactions."
            />

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                        <option value="consumable">Consumables</option>
                        <option value="asset">Assets</option>
                        <option value="all">All Types</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                        <option value="all">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
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
                    <label className="filter-label">Vendor</label>
                    <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} className="filter-select">
                        <option value="all">All Vendors</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Stock Table + Detail Panel */}
            <div className="so-layout">
                    <div className="zu-table-wrapper so-table-wrap">
                        <div className="table-header">
                            <h3 className="table-title">Products ({filteredStocks.length})</h3>
                            <span className="text-muted so-hint">
                                {filterType === 'asset'
                                    ? 'Quantities are received totals — individual units are tracked in the Asset module'
                                    : 'Click a row to see transactions'}
                            </span>
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
                                <table className="zu-table">
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
                                                    onClick={() => openPanel(stock)}
                                                >
                                                    <td><span className="mono-sm">{stripHospitalPrefix(stock.itemCode) || '-'}</span></td>
                                                    <td>
                                                        <strong>{stock.itemName}</strong>
                                                        {stock.billingGroup === 'ASSET' && <span className="badge badge-primary so-asset-badge">Asset</span>}
                                                    </td>
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
                                                        {stock.billingGroup === 'ASSET' ? (
                                                            <button
                                                                onClick={() => openPanel(stock)}
                                                                className="btn btn-sm btn-outline so-adjust-btn"
                                                                title="View individual asset units"
                                                            >
                                                                <Cpu size={13} />
                                                                View Units
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleLogStockClick(stock)}
                                                                className="btn btn-sm btn-outline so-adjust-btn"
                                                                title="Adjust stock"
                                                            >
                                                                <Edit3 size={13} />
                                                                Adjust
                                                            </button>
                                                        )}
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
                        const isAsset = panelStock.billingGroup === 'ASSET';
                        return (
                            <div className="so-panel">
                                <div className="so-panel-header">
                                    <div>
                                        <div className="so-panel-name">{panelStock.itemName}</div>
                                        <div className="so-panel-meta">{panelStock.storeName || 'Store'} · {stripHospitalPrefix(panelStock.itemCode) || ''}</div>
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

                                <div className="so-panel-tabs">
                                    {isAsset && (
                                        <button className={`so-panel-tab${panelTab === 'units' ? ' so-panel-tab--active' : ''}`} onClick={() => handlePanelTab('units')}>
                                            <Cpu size={13} /> Units
                                        </button>
                                    )}
                                    <button className={`so-panel-tab${panelTab === 'txns' ? ' so-panel-tab--active' : ''}`} onClick={() => handlePanelTab('txns')}>
                                        Transactions
                                    </button>
                                    {!isAsset && (
                                        <button className={`so-panel-tab${panelTab === 'batches' ? ' so-panel-tab--active' : ''}`} onClick={() => handlePanelTab('batches')}>
                                            <Layers size={13} /> Batches
                                        </button>
                                    )}
                                </div>

                                {panelTab === 'txns' && (
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
                                                            <span className="so-txn-badge" style={{ color: t.color, background: t.bg }}>{t.label}</span>
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
                                )}

                                {panelTab === 'batches' && (
                                    <div className="so-txn-scroll">
                                        {batchesLoading ? (
                                            <div className="so-txn-empty"><div className="spinner"></div></div>
                                        ) : panelBatches.length === 0 ? (
                                            <div className="so-txn-empty">No batch data recorded yet</div>
                                        ) : panelBatches.map(b => {
                                            const days = b.expiryDate ? Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000) : null;
                                            return (
                                                <div key={b.id} className="so-txn-row">
                                                    <div className="so-txn-body">
                                                        <div className="so-txn-top">
                                                            <span className="so-batch-no">{b.batchNumber || 'No Batch'}</span>
                                                            <span className="so-batch-qty">Qty: {Number(b.quantityAvailable).toLocaleString()}</span>
                                                        </div>
                                                        {b.expiryDate && (
                                                            <div className="so-txn-date">
                                                                Expiry: {new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                {days !== null && (
                                                                    <span className={`so-batch-expiry-tag ${days < 0 ? 'so-batch-expiry-tag--expired' : days <= 30 ? 'so-batch-expiry-tag--critical' : days <= 60 ? 'so-batch-expiry-tag--warn' : 'so-batch-expiry-tag--ok'}`}>
                                                                        {days < 0 ? `Expired` : days <= 30 ? `${days}d left` : days <= 60 ? `${days}d` : 'OK'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {panelTab === 'units' && (
                                    <div className="so-txn-scroll">
                                        {assetUnitsLoading ? (
                                            <div className="so-txn-empty"><div className="spinner"></div></div>
                                        ) : panelAssetUnits.length === 0 ? (
                                            <div className="so-txn-empty">No asset records found yet. Sync may be pending.</div>
                                        ) : (
                                            <>
                                                <div className="so-units-summary">
                                                    <div className="so-units-summary-item">
                                                        <span className="so-units-summary-val">{panelAssetUnits.filter(a => a.roomId != null).length}</span>
                                                        <span className="so-units-summary-label">Assigned</span>
                                                    </div>
                                                    <div className="so-units-summary-item">
                                                        <span className="so-units-summary-val">{panelAssetUnits.filter(a => a.roomId == null && a.status !== 'RETIRED').length}</span>
                                                        <span className="so-units-summary-label">In Store</span>
                                                    </div>
                                                    <div className="so-units-summary-item">
                                                        <span className="so-units-summary-val">{panelAssetUnits.filter(a => a.status === 'UNDER_MAINTENANCE').length}</span>
                                                        <span className="so-units-summary-label">Maintenance</span>
                                                    </div>
                                                </div>
                                                {panelAssetUnits.map(a => {
                                                    const meta = ASSET_STATUS[a.status] || { label: a.status || 'Unknown', cls: 'asset-status--store' };
                                                    const hasRoom = a.roomId != null;
                                                    return (
                                                        <div key={a.assetId} className="so-unit-row">
                                                            <div className="so-unit-code">{a.assetCode || a.assetId?.slice(0, 8)}</div>
                                                            <div className="so-unit-meta">
                                                                <span className={`sd-asset-status ${meta.cls}`}>{meta.label}</span>
                                                                {hasRoom && <span className="so-unit-location">Room {a.roomId}</span>}
                                                                {!hasRoom && a.status === 'ACTIVE' && <span className="so-unit-location">Central Store</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

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

        </div>
    );
}
