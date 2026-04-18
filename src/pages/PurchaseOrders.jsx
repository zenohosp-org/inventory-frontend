import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, AlertCircle } from 'lucide-react';
import {
    getPurchaseOrders, createPurchaseOrder,
    getVendors, getItems, getStores,
    recordPOReceipt, convertPOToBill,
} from '../api/client';
import './PurchaseOrders.css';

const STATUS_MAP = {
    ORDERED:             { label: 'Ordered',  color: 'badge-primary' },
    PARTIALLY_RECEIVED:  { label: 'Partial',  color: 'badge-warning' },
    RECEIVED:            { label: 'Received', color: 'badge-success' },
    BILLED:              { label: 'Billed',   color: 'badge-secondary' },
};

const EMPTY_FORM = { vendorId: '', storeId: '', expectedDate: '', items: [{ itemId: '', quantity: 1, unitPrice: 0 }] };

export default function PurchaseOrders() {
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [activeStores, setActiveStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [receiptModal, setReceiptModal] = useState(null);
    const [receiptQtys, setReceiptQtys] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const extractArray = (res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) return data;
        try { const p = JSON.parse(data); return Array.isArray(p) ? p : []; } catch { return []; }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [posRes, vendsRes, itemsRes, storesRes] = await Promise.all([
                getPurchaseOrders(), getVendors(), getItems(), getStores(),
            ]);
            setPos(extractArray(posRes));
            setVendors(extractArray(vendsRes));
            setItems(extractArray(itemsRes));
            setActiveStores(extractArray(storesRes).filter(s => s?.isActive));
        } catch (e) {
            setError('Failed to load data. ' + (e.response?.data?.message || e.message));
            setPos([]); setVendors([]); setItems([]); setActiveStores([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Create PO ──
    const handleItemChange = (idx, field, value) => {
        const next = [...formData.items];
        next[idx] = { ...next[idx], [field]: value };
        setFormData(f => ({ ...f, items: next }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const validItems = formData.items.filter(i => i.itemId && i.quantity > 0);
        if (!formData.storeId) { alert('Please select a store'); return; }
        if (!formData.vendorId) { alert('Please select a vendor'); return; }
        if (!formData.expectedDate) { alert('Please select expected date'); return; }
        if (validItems.length === 0) { alert('Please add at least one item'); return; }

        try {
            await createPurchaseOrder({
                storeId: formData.storeId,
                vendorId: formData.vendorId,
                expectedDate: formData.expectedDate,
                items: validItems.map(i => ({
                    itemId: i.itemId,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice) || 0,
                })),
            });
            setShowCreateModal(false);
            setFormData(EMPTY_FORM);
            await fetchData();
        } catch (e) {
            alert('Failed to create PO: ' + (e.response?.data?.message || e.message));
        }
    };

    // ── Record Receipt ──
    const openReceiptModal = (po) => {
        const init = {};
        (po.items || []).forEach(item => { init[item.id] = ''; });
        setReceiptQtys(init);
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
            setReceiptModal(null);
            await fetchData();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Convert to Bill ──
    const handleConvertToBill = async (poId) => {
        if (!window.confirm('Convert this PO to a bill?')) return;
        try {
            await convertPOToBill(poId);
            await fetchData();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        }
    };

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title">
                    <ShoppingCart size={26} />
                    Purchase Orders
                </h1>
                <p className="page-subtitle">Create and manage purchase orders from suppliers.</p>
            </div>

            {error && (
                <div className="po-error-banner">
                    <AlertCircle size={18} className="po-error-banner-icon" />
                    <div className="po-error-banner-body">
                        <strong>Error</strong>
                        {error}
                    </div>
                    <button className="po-error-retry" onClick={fetchData}>Retry</button>
                </div>
            )}

            <div className="page-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    disabled={activeStores.length === 0}
                    title={activeStores.length === 0 ? 'Create a store first' : ''}
                >
                    <Plus size={18} />
                    Create Purchase Order
                </button>
                {activeStores.length === 0 && (
                    <div className="po-no-store-warn">
                        <AlertCircle size={16} />
                        <span>No active stores. <strong>Create a store first</strong> before making a purchase order.</span>
                    </div>
                )}
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Purchase Orders ({pos.length})</h3>
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
                                    <th>Store</th>
                                    <th>Order Date</th>
                                    <th>Expected</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map(po => {
                                    const s = STATUS_MAP[po.status] || { label: po.status || '-', color: 'badge-secondary' };
                                    return (
                                        <tr key={po.id}>
                                            <td><strong className="mono">{po.poNumber || po.id}</strong></td>
                                            <td>{po.vendor?.name || po.vendorName || '-'}</td>
                                            <td className="po-store-col">{po.store?.name || '-'}</td>
                                            <td className="text-muted">{new Date(po.createdAt).toLocaleDateString()}</td>
                                            <td className="text-muted">
                                                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>
                                                <span className="po-count-chip">{po.items?.length || 0}</span>
                                            </td>
                                            <td>₹{Number(po.totalAmount || 0).toLocaleString()}</td>
                                            <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                                            <td>
                                                <div className="po-action-group">
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
                    <span className="table-info">Total: {pos.length} purchase orders</span>
                </div>
            </div>

            {/* Create PO Modal */}
            {showCreateModal && (
                <div className="modal-overlay active">
                    <div className="modal po-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Create Purchase Order</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Store</label>
                                    <select
                                        className="form-select"
                                        value={formData.storeId}
                                        onChange={e => setFormData(f => ({ ...f, storeId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Store</option>
                                        {activeStores.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Vendor</label>
                                    <select
                                        className="form-select"
                                        value={formData.vendorId}
                                        onChange={e => setFormData(f => ({ ...f, vendorId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Expected Delivery Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.expectedDate}
                                        onChange={e => setFormData(f => ({ ...f, expectedDate: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Line Items</label>
                                    <div className="po-line-items">
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="po-line-item">
                                                <div>
                                                    <span className="po-line-item-label">Product</span>
                                                    <select
                                                        className="form-select"
                                                        value={item.itemId}
                                                        onChange={e => handleItemChange(idx, 'itemId', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select</option>
                                                        {items.map(i => (
                                                            <option key={i.id} value={i.id}>{i.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <span className="po-line-item-label">Qty</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="form-input"
                                                        value={item.quantity}
                                                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <span className="po-line-item-label">Unit Price (₹)</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        value={item.unitPrice}
                                                        onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger po-remove-btn"
                                                    onClick={() => setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary po-add-item"
                                        onClick={() => setFormData(f => ({ ...f, items: [...f.items, { itemId: '', quantity: 1, unitPrice: 0 }] }))}
                                    >
                                        <Plus size={15} />
                                        Add Item
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create PO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Receipt Modal */}
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
