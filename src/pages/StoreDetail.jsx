import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store as StoreIcon, Package, ShoppingCart, X, ArrowLeftRight } from 'lucide-react';
import { getStores, getStockOverview, getPOsByStore, recordPOReceipt, convertPOToBill } from '../api/client';
import TransferStockModal from '../components/TransferStockModal';

const STATUS_BADGE = {
    ORDERED: 'badge-primary',
    PARTIALLY_RECEIVED: 'badge-warning',
    RECEIVED: 'badge-success',
    BILLED: 'badge-secondary',
};

function StatusBadge({ status }) {
    return (
        <span className={`badge ${STATUS_BADGE[status] || 'badge-secondary'}`}>
            {status?.replace(/_/g, ' ') || 'Unknown'}
        </span>
    );
}

export default function StoreDetail() {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [allStores, setAllStores] = useState([]);
    const [stock, setStock] = useState([]);
    const [pos, setPos] = useState([]);
    const [activeTab, setActiveTab] = useState('pos');
    const [onlyOpen, setOnlyOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [receiptModal, setReceiptModal] = useState(null);
    const [receiptQtys, setReceiptQtys] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [transferModal, setTransferModal] = useState(null);

    useEffect(() => {
        loadStore();
    }, [storeId]);

    useEffect(() => {
        if (activeTab === 'stock') loadStock();
        else loadPOs();
    }, [activeTab, onlyOpen, storeId]);

    const loadStore = async () => {
        try {
            const res = await getStores();
            const stores = Array.isArray(res.data) ? res.data : [];
            setAllStores(stores);
            setStore(stores.find(s => s.id === storeId) || null);
        } catch (_) {}
    };

    const loadStock = async () => {
        setLoading(true);
        try {
            const res = await getStockOverview();
            const all = Array.isArray(res.data) ? res.data : [];
            setStock(all.filter(s => s.storeId === storeId));
        } catch (_) {
            setStock([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPOs = async () => {
        setLoading(true);
        try {
            const res = await getPOsByStore(storeId, onlyOpen);
            setPos(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setPos([]);
        } finally {
            setLoading(false);
        }
    };

    const openReceiptModal = (po) => {
        const initial = {};
        (po.items || []).forEach(item => { initial[item.id] = ''; });
        setReceiptQtys(initial);
        setReceiptModal(po);
    };

    const handleReceiptSubmit = async () => {
        const items = Object.entries(receiptQtys)
            .filter(([, qty]) => qty !== '' && Number(qty) > 0)
            .map(([poItemId, receivedQty]) => ({ poItemId, receivedQty: Number(receivedQty) }));

        if (items.length === 0) return;
        setSubmitting(true);
        try {
            await recordPOReceipt(receiptModal.id, items);
            console.log('Receipt recorded for PO:', receiptModal.id);
            setReceiptModal(null);
            await loadPOs();
            alert('✓ Receipt recorded! Check the PO status below. If fully received, click "Convert to Bill".');
        } catch (e) {
            console.error('Record receipt error:', e);
            alert('Failed to record receipt: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleConvertToBill = async (poId) => {
        if (!window.confirm('Convert this fully received PO to a bill?')) return;
        console.log('Converting PO to bill:', poId);
        try {
            await convertPOToBill(poId);
            console.log('Bill created successfully');
            await loadPOs();
            alert('✓ Bill created! Check the PO Bills page (/po-bill) to see and manage the invoice.');
        } catch (e) {
            console.error('Convert to bill error:', e);
            alert('Failed to convert: ' + (e.response?.data?.message || e.message));
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
                                            <td><strong className="mono">{po.poNumber}</strong></td>
                                            <td>{po.vendor?.name || '-'}</td>
                                            <td className="text-muted">
                                                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>{po.items?.length || 0} items</td>
                                            <td>₹{Number(po.totalAmount || 0).toLocaleString()}</td>
                                            <td><StatusBadge status={po.status} /></td>
                                            <td>
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
                                                {po.status === 'BILLED' && (
                                                    <span className="text-muted">Billed</span>
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

            {activeTab === 'stock' && (
                <div className="table-container">
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
                                        <th>Available Qty</th>
                                        <th>Reorder Level</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stock.map(s => {
                                        const low = s.reorderLevel != null && Number(s.quantityAvail) <= Number(s.reorderLevel);
                                        return (
                                            <tr key={s.id}>
                                                <td><strong>{s.itemName}</strong></td>
                                                <td className="mono text-muted">{s.itemCode || '-'}</td>
                                                <td className="text-muted">{s.categoryName || '-'}</td>
                                                <td><strong>{s.quantityAvail}</strong></td>
                                                <td className="text-muted">{s.reorderLevel ?? '-'}</td>
                                                <td>
                                                    {low
                                                        ? <span className="badge badge-error">Low Stock</span>
                                                        : <span className="badge badge-success">OK</span>}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => setTransferModal(s)}
                                                        disabled={Number(s.quantityAvail) <= 0}
                                                    >
                                                        <ArrowLeftRight size={13} /> Transfer
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {transferModal && (
                <TransferStockModal
                    stock={transferModal}
                    fromStoreId={storeId}
                    stores={allStores}
                    onClose={() => setTransferModal(null)}
                    onSuccess={() => { setTransferModal(null); loadStock(); }}
                />
            )}

            {receiptModal && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Record Receipt — {receiptModal.poNumber}</h2>
                            <button className="modal-close" onClick={() => setReceiptModal(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Ordered</th>
                                        <th>Already Received</th>
                                        <th>Enter Qty</th>
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
