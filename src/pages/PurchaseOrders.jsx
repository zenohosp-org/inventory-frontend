import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, AlertCircle } from 'lucide-react';
import { getPurchaseOrders, createPurchaseOrder, getVendors, getItems, getStores } from '../api/client';


export default function PurchaseOrders() {
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);
    const [activeStores, setActiveStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        setError(null);
        try {
            console.log('=== Fetching PO data ===');
            const posRes = await getPurchaseOrders();
            console.log('PO Response:', { full: posRes, data: posRes.data, isArray: Array.isArray(posRes.data) });
            
            const [vendsRes, itemsRes, storesRes] = await Promise.all([
                getVendors(),
                getItems(),
                getStores()
            ]);
            
            // Safely extract arrays from responses
            const posData = Array.isArray(posRes.data) ? posRes.data : (Array.isArray(posRes) ? posRes : []);
            const vendorsData = Array.isArray(vendsRes.data) ? vendsRes.data : (Array.isArray(vendsRes) ? vendsRes : []);
            const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : (Array.isArray(itemsRes) ? itemsRes : []);
            const storesData = Array.isArray(storesRes.data) ? storesRes.data : (Array.isArray(storesRes) ? storesRes : []);
            
            console.log('Loaded data:', {
                pos: posData,
                vendors: vendorsData,
                items: itemsData,
                stores: storesData
            });
            
            setPos(posData);
            setVendors(vendorsData);
            setItems(itemsData);
            setStores(storesData);
            
            const active = storesData.filter(s => s && s.isActive);
            setActiveStores(active);
        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            setError('Failed to load purchase orders. ' + (error.response?.data?.message || error.message));
            
            // Set safe defaults on error
            setPos([]);
            setVendors([]);
            setItems([]);
            setStores([]);
            setActiveStores([]);
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
            // Check if there are active stores
            if (activeStores.length === 0) {
                alert('Error: No active stores available. Please create and activate a store first before creating a purchase order.');
                return;
            }

            // Filter out empty items and ensure proper data types
            const validItems = formData.items.filter(i => i.itemId && i.quantity > 0);
            
            if (!formData.vendorId) {
                alert('Please select a vendor');
                return;
            }
            
            if (!formData.expectedDate) {
                alert('Please select expected date');
                return;
            }
            
            if (validItems.length === 0) {
                alert('Please add at least one item');
                return;
            }
            
            const payload = {
                vendorId: formData.vendorId,
                expectedDate: formData.expectedDate,
                items: validItems.map(item => ({
                    itemId: item.itemId,
                    quantity: Number(item.quantity) || 0,
                    unitPrice: Number(item.unitPrice) || 0
                }))
            };
            
            console.log('Creating PO with payload:', payload);
            console.log('Using store:', activeStores[0]?.name || 'Default');
            const poResponse = await createPurchaseOrder(payload);
            console.log('PO Creation Response:', poResponse);

            // Success! Close modal and refresh data
            setShowModal(false);
            setFormData({
                vendorId: '',
                expectedDate: '',
                items: [{ itemId: '', quantity: 1, unitPrice: 0 }]
            });
            
            // Refresh the data
            console.log('Refreshing data after PO creation...');
            await fetchData();
            alert('Purchase Order created successfully!');
        } catch (error) {
            console.error('Error creating PO:', error);
            console.error('Error response:', error.response?.data);
            alert('Failed to create Purchase Order: ' + (error.response?.data?.message || error.message));
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
                <h1 className="flex page-title" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <ShoppingCart size={28} style={{ color: 'var(--color-accent)' }} />
                    Purchase Orders
                </h1>
                <p className="page-subtitle">
                    Create and manage purchase orders from suppliers.
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-4)',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                    color: '#991b1b'
                }}>
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <strong>Error</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: 'var(--fs-sm)' }}>{error}</p>
                    </div>
                    <button
                        onClick={fetchData}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#991b1b',
                            cursor: 'pointer',
                            fontSize: 'var(--fs-sm)',
                            fontWeight: 'var(--fw-semibold)',
                            textDecoration: 'underline'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Page Actions */}
            <div className="page-actions">
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowModal(true)}
                    disabled={activeStores.length === 0}
                    title={activeStores.length === 0 ? 'Create an active store first' : 'Create new purchase order'}
                >
                    <Plus size={18} />
                    Create Purchase Order
                </button>
                {activeStores.length === 0 && (
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-3)',
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderRadius: 'var(--radius-md)',
                        color: '#92400e',
                        fontSize: 'var(--fs-sm)',
                        flex: 1
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>No active stores found. <strong>Create a store first</strong> before creating purchase orders.</span>
                    </div>
                )}
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
                                {/* Store Information Alert */}
                                {activeStores.length === 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-3)',
                                        padding: 'var(--spacing-4)',
                                        backgroundColor: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-4)',
                                        color: '#991b1b'
                                    }}>
                                        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <div>
                                            <strong>No Active Store Found</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--fs-sm)' }}>
                                                Please create and activate a store in the <strong>Stores Master</strong> page before creating a purchase order.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-3)',
                                        padding: 'var(--spacing-4)',
                                        backgroundColor: '#f0fdf4',
                                        border: '1px solid #86efac',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-4)',
                                        color: '#166534'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: 'var(--fs-sm)' }}>Store for this PO:</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--fs-sm)' }}>
                                                {activeStores[0]?.name} ({activeStores[0]?.type})
                                            </p>
                                        </div>
                                    </div>
                                )}

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
