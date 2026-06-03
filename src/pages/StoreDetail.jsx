import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store as StoreIcon, Package, ShoppingCart, X, ArrowLeftRight, Cpu } from 'lucide-react';
import { getStores, getStockOverview, getPOsByStore, recordPOReceipt, convertPOToBill, getAssets } from '../api/client';
import './StoreDetail.css';
import TransferStockModal from '../components/TransferStockModal';
import { useToast } from '../context/ToastContext';
import { stripHospitalPrefix } from '../utils/format';

const PO_STATUS_BADGE = {
    DRAFT:              'badge-secondary',
    ORDERED:            'badge-primary',
    PARTIALLY_RECEIVED: 'badge-warning',
    RECEIVED:           'badge-success',
    BILLED:             'badge-secondary',
    CANCELLED:          'badge-error',
};

const PO_STATUS_LABEL = {
    DRAFT:              'Draft',
    ORDERED:            'Ordered',
    PARTIALLY_RECEIVED: 'Partial',
    RECEIVED:           'Received',
    BILLED:             'Billed',
    CANCELLED:          'Cancelled',
};

const ASSET_STATUS = {
    ACTIVE:            { label: 'In Store',     cls: 'asset-status--store'  },
    IN_USE:            { label: 'In Use',        cls: 'asset-status--inuse'  },
    UNDER_MAINTENANCE: { label: 'Maintenance',   cls: 'asset-status--maint'  },
    RETIRED:           { label: 'Retired',       cls: 'asset-status--retired'},
};

function StatusBadge({ status }) {
    return (
        <span className={`badge ${PO_STATUS_BADGE[status] || 'badge-secondary'}`}>
            {PO_STATUS_LABEL[status] || status?.replace(/_/g, ' ') || 'Unknown'}
        </span>
    );
}

export default function StoreDetail() {
    const { toast } = useToast();
    const { storeId } = useParams();
    const [store, setStore]         = useState(null);
    const [allStores, setAllStores] = useState([]);
    const [stock, setStock]         = useState([]);
    const [pos, setPos]             = useState([]);
    const [activeTab, setActiveTab] = useState('pos');
    const [onlyOpen, setOnlyOpen]   = useState(false);
    const [loading, setLoading]     = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modals
    const [receiptModal, setReceiptModal] = useState(null);
    const [receiptQtys, setReceiptQtys]   = useState({});
    const [receiptBatches, setReceiptBatches] = useState({});
    const [receiptExpiries, setReceiptExpiries] = useState({});
    const [transferModal, setTransferModal] = useState(null);

    // Asset units panel
    const [assetUnitsStock, setAssetUnitsStock] = useState(null); // which stock item
    const [assetUnits, setAssetUnits]           = useState([]);
    const [assetUnitsLoading, setAssetUnitsLoading] = useState(false);

    const loadStore = useCallback(async () => {
        try {
            const res = await getStores();
            const stores = Array.isArray(res.data) ? res.data : [];
            setAllStores(stores);
            setStore(stores.find(s => s.id === storeId) || null);
        } catch (_) {}
    }, [storeId]);

    const loadStock = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getStockOverview();
            const all = Array.isArray(res.data) ? res.data : [];
            setStock(all.filter(s => s.storeId === storeId));
        } catch (_) { setStock([]); }
        finally { setLoading(false); }
    }, [storeId]);

    const loadPOs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPOsByStore(storeId, onlyOpen);
            setPos(Array.isArray(res.data) ? res.data : []);
        } catch (_) { setPos([]); }
        finally { setLoading(false); }
    }, [storeId, onlyOpen]);

    useEffect(() => { loadStore(); }, [loadStore]);
    useEffect(() => {
        if (activeTab === 'stock') loadStock();
        else loadPOs();
    }, [activeTab, loadStock, loadPOs]);

    const openAssetUnits = async (s) => {
        setAssetUnitsStock(s);
        setAssetUnits([]);
        setAssetUnitsLoading(true);
        try {
            const res = await getAssets();
            const all = Array.isArray(res.data) ? res.data : [];
            setAssetUnits(all.filter(a => a.sourceItemId === s.itemId));
        } catch (_) { setAssetUnits([]); }
        finally { setAssetUnitsLoading(false); }
    };

    const openReceiptModal = (po) => {
        const initial = {};
        (po.items || []).forEach(item => { initial[item.id] = ''; });
        setReceiptQtys(initial);
        setReceiptBatches({});
        setReceiptExpiries({});
        setReceiptModal(po);
    };

    const handleReceiptSubmit = async () => {
        const items = Object.entries(receiptQtys)
            .filter(([, qty]) => qty !== '' && Number(qty) > 0)
            .map(([poItemId, receivedQty]) => ({
                poItemId,
                receivedQty: Number(receivedQty),
                batchNumber: receiptBatches[poItemId] || null,
                expiryDate: receiptExpiries[poItemId] || null,
            }));
        if (items.length === 0) return;
        setSubmitting(true);
        try {
            await recordPOReceipt(receiptModal.id, items);
            setReceiptModal(null);
            await loadPOs();
            toast.success('Receipt recorded successfully');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to record receipt');
        } finally { setSubmitting(false); }
    };

    const handleConvertToBill = async (poId) => {
        try {
            await convertPOToBill(poId);
            await loadPOs();
            toast.success('Bill created — view it on the PO Bills page');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to convert to bill');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <Link to="/stores" className="back-link">
                        <ArrowLeft size={15} /> Stores
                    </Link>
                    <h1 className="page-title">
                        <StoreIcon size={24} />
                        {store?.name || 'Store'}
                    </h1>
                    {store && (
                        <p className="page-subtitle">{store.type}{store.location ? ` · ${store.location}` : ''}</p>
                    )}
                </div>
            </div>

            <div className="tab-bar">
                <button className={`tab-btn ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
                    <ShoppingCart size={15} /> Purchase Orders
                </button>
                <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
                    <Package size={15} /> Stock
                </button>
            </div>

            {/* ── Purchase Orders tab ── */}
            {activeTab === 'pos' && (
                <div className="table-container">
                    <div className="table-header">
                        <h3 className="table-title">Purchase Orders ({pos.length})</h3>
                        <label className="toggle-label">
                            <input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} />
                            Open only
                        </label>
                    </div>
                    <div className="table-body">
                        {loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : pos.length === 0 ? (
                            <div className="table-empty">No purchase orders found.</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>PO #</th>
                                        <th>Vendor</th>
                                        <th>Expected</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pos.map(po => (
                                        <tr key={po.id}>
                                            <td><strong className="mono">{stripHospitalPrefix(po.poNumber)}</strong></td>
                                            <td>{po.vendor?.name || '-'}</td>
                                            <td className="text-muted">
                                                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>{po.items?.length || 0} items</td>
                                            <td>₹{Number(po.totalAmount || 0).toLocaleString()}</td>
                                            <td><StatusBadge status={po.status} /></td>
                                            <td>
                                                {po.status === 'DRAFT' && (
                                                    <span className="text-muted">Pending approval</span>
                                                )}
                                                {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => openReceiptModal(po)}>
                                                        Record Receipt
                                                    </button>
                                                )}
                                                {po.status === 'RECEIVED' && (
                                                    <button className="btn btn-sm btn-success" onClick={() => handleConvertToBill(po.id)}>
                                                        Convert to Bill
                                                    </button>
                                                )}
                                                {(po.status === 'BILLED' || po.status === 'CANCELLED') && (
                                                    <span className="text-muted">{PO_STATUS_LABEL[po.status]}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Stock tab ── */}
            {activeTab === 'stock' && (
                <div className="sd-stock-layout">
                    <div className="table-container sd-stock-table">
                        <div className="table-header">
                            <h3 className="table-title">Stock ({stock.length})</h3>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div className="table-empty"><div className="spinner"></div></div>
                            ) : stock.length === 0 ? (
                                <div className="table-empty">No stock records for this store.</div>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Code</th>
                                            <th>Category</th>
                                            <th>Qty / Units</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stock.map(s => {
                                            const isAsset = s.billingGroup === 'ASSET';
                                            const low = !isAsset && s.reorderLevel != null && Number(s.quantityAvail) <= Number(s.reorderLevel);
                                            const isSelected = assetUnitsStock?.itemId === s.itemId && assetUnitsStock?.storeId === s.storeId;
                                            return (
                                                <tr key={s.id} className={isSelected ? 'so-row-selected' : ''}>
                                                    <td>
                                                        <strong>{s.itemName}</strong>
                                                        {isAsset && <span className="badge badge-primary sd-asset-badge">Asset</span>}
                                                    </td>
                                                    <td className="mono text-muted">{stripHospitalPrefix(s.itemCode) || '-'}</td>
                                                    <td className="text-muted">{s.categoryName || '-'}</td>
                                                    <td>
                                                        {isAsset
                                                            ? <span className="sd-unit-count">{s.quantityAvail} unit{Number(s.quantityAvail) !== 1 ? 's' : ''}</span>
                                                            : <strong>{s.quantityAvail}</strong>
                                                        }
                                                    </td>
                                                    <td>
                                                        {isAsset
                                                            ? <span className="badge badge-secondary">In Register</span>
                                                            : low
                                                                ? <span className="badge badge-error">Low Stock</span>
                                                                : <span className="badge badge-success">OK</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        {isAsset ? (
                                                            <button
                                                                className="btn btn-sm btn-outline sd-view-units-btn"
                                                                onClick={() => isSelected ? setAssetUnitsStock(null) : openAssetUnits(s)}
                                                            >
                                                                <Cpu size={13} />
                                                                {isSelected ? 'Close' : 'View Units'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => setTransferModal(s)}
                                                                disabled={Number(s.quantityAvail) <= 0}
                                                            >
                                                                <ArrowLeftRight size={13} /> Transfer
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
                    </div>

                    {/* ── Asset units side panel ── */}
                    {assetUnitsStock && (
                        <div className="so-panel sd-asset-panel">
                            <div className="so-panel-header">
                                <div>
                                    <div className="so-panel-name">{assetUnitsStock.itemName}</div>
                                    <div className="so-panel-meta">
                                        {assetUnitsStock.quantityAvail} unit{Number(assetUnitsStock.quantityAvail) !== 1 ? 's' : ''} received · tracked in Asset Register
                                    </div>
                                </div>
                                <button className="so-panel-close" onClick={() => setAssetUnitsStock(null)} aria-label="Close">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="so-panel-body">
                                <div className="so-card">
                                    <div className="so-card-header">Individual Units</div>
                                    <div className="so-card-body is-flush">
                                        {assetUnitsLoading ? (
                                            <div className="so-txn-empty"><div className="spinner"></div></div>
                                        ) : assetUnits.length === 0 ? (
                                            <div className="so-txn-empty">No asset records found yet. Sync may be pending.</div>
                                        ) : (
                                            assetUnits.map(a => {
                                                const meta = ASSET_STATUS[a.status] || { label: a.status || 'Unknown', cls: 'asset-status--store' };
                                                const hasRoom = a.roomId != null;
                                                return (
                                                    <div key={a.assetId} className="sd-unit-row">
                                                        <div className="sd-unit-code">{a.assetCode || a.assetId?.slice(0, 8)}</div>
                                                        <div className="sd-unit-meta">
                                                            <span className={`sd-asset-status ${meta.cls}`}>{meta.label}</span>
                                                            {hasRoom && (
                                                                <span className="sd-unit-location">Room {a.roomId}</span>
                                                            )}
                                                            {!hasRoom && a.status === 'ACTIVE' && (
                                                                <span className="sd-unit-location">Central Store</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {assetUnits.length > 0 && (
                                    <div className="so-card">
                                        <div className="so-card-header">Summary</div>
                                        <div className="so-card-body">
                                            <div className="sd-summary-grid">
                                                <div className="sd-summary-item">
                                                    <span className="sd-summary-val">{assetUnits.filter(a => a.roomId != null).length}</span>
                                                    <span className="sd-summary-label">Assigned</span>
                                                </div>
                                                <div className="sd-summary-item">
                                                    <span className="sd-summary-val">{assetUnits.filter(a => a.roomId == null && a.status !== 'RETIRED').length}</span>
                                                    <span className="sd-summary-label">In Store</span>
                                                </div>
                                                <div className="sd-summary-item">
                                                    <span className="sd-summary-val">{assetUnits.filter(a => a.status === 'UNDER_MAINTENANCE').length}</span>
                                                    <span className="sd-summary-label">In Maintenance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Transfer modal ── */}
            {transferModal && (
                <TransferStockModal
                    stock={transferModal}
                    fromStoreId={storeId}
                    stores={allStores}
                    onClose={() => setTransferModal(null)}
                    onSuccess={() => { setTransferModal(null); loadStock(); }}
                />
            )}

            {/* ── Receipt modal ── */}
            {receiptModal && (
                <div className="modal-overlay active">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h2 className="modal-title">Record Receipt — {stripHospitalPrefix(receiptModal.poNumber)}</h2>
                            <button className="modal-close" onClick={() => setReceiptModal(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted">Batch No and Expiry are optional — filling them enables expiry tracking on the dashboard.</p>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Ordered</th>
                                        <th>Received</th>
                                        <th>Qty</th>
                                        <th>Batch No</th>
                                        <th>Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(receiptModal.items || []).map(item => (
                                        <tr key={item.id}>
                                            <td><strong>{item.inventoryItem?.name || '-'}</strong></td>
                                            <td>{item.quantity}</td>
                                            <td>{item.receivedQty ?? 0}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    className="form-input"
                                                    value={receiptQtys[item.id] ?? ''}
                                                    onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={receiptBatches[item.id] ?? ''}
                                                    onChange={e => setReceiptBatches(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    placeholder="e.g. B-001"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={receiptExpiries[item.id] ?? ''}
                                                    onChange={e => setReceiptExpiries(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setReceiptModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleReceiptSubmit} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Confirm Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
