import React, { useState, useEffect } from 'react';
import {
    getStockAdjustments,
    createStockAdjustment,
    getStores,
    getItems,
    getStockBatches
} from '../api/client';
import { Plus, PackageOpen, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

const StockAdjustments = () => {
    const { toast } = useToast();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [stores, setStores] = useState([]);
    const [items, setItems] = useState([]);
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        storeId: '',
        inventoryItemId: '',
        batchNumber: '',
        actualQty: '',
        reason: 'SHRINKAGE',
        remarks: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchFormOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getStockAdjustments();
            setAdjustments(res.data);
        } catch (error) {
            console.error("Error fetching stock adjustments:", error);
        }
        setLoading(false);
    };

    const fetchFormOptions = async () => {
        try {
            const [storesRes, itemsRes] = await Promise.all([
                getStores(),
                getItems()
            ]);
            setStores(storesRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            console.error("Error fetching form options:", error);
        }
    };

    const fetchBatches = async (storeId, itemId) => {
        if (!storeId || !itemId) {
            setBatches([]);
            return;
        }
        try {
            const res = await getStockBatches(storeId, itemId);
            setBatches(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching batches:", error);
            setBatches([]);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'storeId') {
            fetchBatches(value, formData.inventoryItemId);
        } else if (name === 'inventoryItemId') {
            fetchBatches(formData.storeId, value);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setBatches([]);
        setFormData({
            storeId: '',
            inventoryItemId: '',
            batchNumber: '',
            actualQty: '',
            reason: 'SHRINKAGE',
            remarks: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createStockAdjustment({
                ...formData,
                actualQty: parseInt(formData.actualQty)
            });
            closeModal();
            fetchData();
            toast.success('Adjustment posted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating adjustment');
        }
        setSubmitting(false);
    };

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <PackageOpen size={24} style={{ marginRight: '8px' }} />
                        Stock Adjustments
                    </>
                }
                subtitle="Audit and reconcile physical stock levels"
                actions={
                    <>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary"
                        >
                            <Plus size={16} style={{ marginRight: '8px' }} />
                            New Adjustment
                        </button>
                    </>
                }
            />

            <div className="zu-page-content">

            {loading ? (
                <div className="table-empty"><div className="spinner"></div></div>
            ) : adjustments.length === 0 ? (
                <div className="empty-state">
                    <PackageOpen size={48} className="empty-state-icon" style={{ color: '#9ca3af' }} />
                    <h3 className="empty-state-title">No Adjustments Found</h3>
                    <p className="empty-state-desc">Physical stock has not been adjusted yet.</p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item & Batch</th>
                                    <th>Reason</th>
                                    <th style={{ textAlign: 'right' }}>Adjustment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adjustments.map((adj) => (
                                    <tr key={adj.id}>
                                        <td className="text-muted">
                                            {new Date(adj.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <strong>{adj.inventoryItem?.name}</strong>
                                            <div className="mono text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>Batch: {adj.batchNumber}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                adj.reason === 'EXPIRY' ? 'badge-error' : 
                                                adj.reason === 'BREAKAGE' ? 'badge-warning' : 
                                                'badge-secondary'}`}>
                                                {adj.reason}
                                            </span>
                                            {adj.remarks && <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>{adj.remarks}</div>}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <strong className={adj.adjustmentQty > 0 ? 'text-success' : 'text-danger'}>
                                                {adj.adjustmentQty > 0 ? '+' : ''}{adj.adjustmentQty}
                                            </strong>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">New Stock Adjustment</h2>
                            <button className="modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Store *</label>
                                    <select
                                        className="form-select"
                                        name="storeId"
                                        value={formData.storeId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select Store</option>
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Item *</label>
                                    <select
                                        className="form-select"
                                        name="inventoryItemId"
                                        value={formData.inventoryItemId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select Item</option>
                                        {items.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Batch *</label>
                                    <select
                                        className="form-select"
                                        name="batchNumber"
                                        value={formData.batchNumber}
                                        onChange={handleFormChange}
                                        required
                                        disabled={!formData.storeId || !formData.inventoryItemId}
                                    >
                                        <option value="">
                                            {!formData.storeId || !formData.inventoryItemId
                                                ? 'Select store and item first'
                                                : batches.length === 0 ? 'No batches with stock' : 'Select Batch'}
                                        </option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.batchNumber}>
                                                {b.batchNumber} (Current: {b.quantityAvailable})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Actual Physical Quantity *</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        name="actualQty"
                                        value={formData.actualQty}
                                        onChange={handleFormChange}
                                        required
                                        min="0"
                                        placeholder="Enter counted quantity"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reason *</label>
                                    <select
                                        className="form-select"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="SHRINKAGE">Shrinkage / Missing</option>
                                        <option value="BREAKAGE">Breakage / Damaged</option>
                                        <option value="EXPIRY">Expired</option>
                                        <option value="DATA_CORRECTION">Data Entry Correction</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Remarks (Optional)</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleFormChange}
                                        placeholder="Any notes?"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Post Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default StockAdjustments;
