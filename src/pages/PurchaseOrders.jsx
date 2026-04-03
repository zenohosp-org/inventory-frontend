import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PurchaseOrders() {
    const { getAuthHeaders } = useAuth();
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        vendorId: '',
        expectedDate: '',
        items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [posRes, vendsRes, itemsRes] = await Promise.all([
                axios.get('/api/inventory/purchase-orders', { headers: getAuthHeaders() }),
                axios.get('/api/vendors', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/items', { headers: getAuthHeaders() })
            ]);
            setPos(posRes.data || []);
            setVendors(vendsRes.data || []);
            setItems(itemsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemId: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/inventory/purchase-orders', {
                vendorId: formData.vendorId,
                expectedDate: formData.expectedDate,
                items: formData.items.filter(i => i.itemId && i.quantity > 0)
            }, { headers: getAuthHeaders() });

            setShowModal(false);
            setFormData({
                vendorId: '',
                expectedDate: '',
                items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
            });
            fetchData();
        } catch (error) {
            console.error('Error creating PO:', error);
            alert('Failed to create Purchase Order');
        }
    };

    const getPoStatus = (po) => {
        const now = new Date();
        const expected = new Date(po.expectedDate);
        if (expected < now) return { label: 'Overdue', color: 'badge-error' };
        return { label: po.status || 'Pending', color: 'badge-primary' };
    };

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <ShoppingCart size={28} style={{ color: 'var(--color-accent)' }} />
                    Purchase Orders
                </h1>
                <p className="page-subtitle">
                    Create and manage purchase orders from suppliers.
                </p>
            </div>

            {/* Page Actions */}
            <div className="page-actions">
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Create Purchase Order
                </button>
            </div>

            {/* Purchase Orders Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Purchase Orders ({pos.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : pos.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No purchase orders found.
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>PO Number</th>
                                    <th style={{ width: '20%' }}>Vendor</th>
                                    <th style={{ width: '15%' }}>Order Date</th>
                                    <th style={{ width: '15%' }}>Expected Delivery</th>
                                    <th style={{ width: '12%' }}>Item Count</th>
                                    <th style={{ width: '12%' }}>Status</th>
                                    <th style={{ width: '11%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map((po, idx) => {
                                    const status = getPoStatus(po);
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                                                    {po.poNumber || `PO-${po.id}`}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>{po.vendorName || po.vendor?.name || 'N/A'}</strong>
                                            </td>
                                            <td className="text-muted">
                                                {new Date(po.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="text-muted">
                                                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>
                                                <span style={{ backgroundColor: 'var(--color-gray-100)', padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)' }}>
                                                    {po.items?.length || 0} items
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-ghost" title="View details">
                                                    View
                                                </button>
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
                        Total: {pos.length} purchase orders
                    </span>
                </div>
            </div>

            {/* Create PO Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Purchase Order</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {/* Vendor Selection */}
                                <div className="form-group">
                                    <label className="form-label required">Vendor</label>
                                    <select
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Expected Date */}
                                <div className="form-group">
                                    <label className="form-label required">Expected Delivery Date</label>
                                    <input
                                        type="date"
                                        value={formData.expectedDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                {/* Line Items */}
                                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                                    <label className="form-label">Line Items</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 100px 120px 40px',
                                                gap: 'var(--spacing-4)',
                                                alignItems: 'flex-end',
                                                padding: 'var(--spacing-4)',
                                                backgroundColor: 'var(--color-gray-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--color-gray-200)'
                                            }}>
                                                <div>
                                                    <label style={{ fontSize: 'var(--fs-xs)', display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--fw-medium)', color: 'var(--color-gray-600)' }}>
                                                        Product
                                                    </label>
                                                    <select
                                                        value={item.itemId}
                                                        onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                                                        className="form-select"
                                                        required
                                                    >
                                                        <option value="">Select</option>
                                                        {items.map(i => (
                                                            <option key={i.id} value={i.id}>{i.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: 'var(--fs-xs)', display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--fw-medium)', color: 'var(--color-gray-600)' }}>
                                                        Qty
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                        className="form-input"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: 'var(--fs-xs)', display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--fw-medium)', color: 'var(--color-gray-600)' }}>
                                                        Unit Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                                        className="form-input"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="btn btn-sm btn-danger"
                                                    style={{ padding: 'var(--spacing-2)' }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="btn btn-sm btn-secondary"
                                        style={{ marginTop: 'var(--spacing-4)' }}
                                    >
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!formData.vendorId || !formData.expectedDate || formData.items.length === 0}
                                >
                                    Create PO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
