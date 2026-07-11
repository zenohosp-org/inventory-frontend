import React, { useState, useEffect } from 'react';
import { 
    getStockAdjustments, 
    createStockAdjustment, 
    getStores, 
    getInventoryItems, 
    getStockBatches 
} from '../api/client';
import { RefreshCw, Plus, PackageOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const StockAdjustments = () => {
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
                getInventoryItems()
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
            // Reusing getStockBatches but we might need to filter by store/item
            const res = await getStockBatches(); 
            // In a real scenario, this would take storeId and itemId as params
            // Filtering on frontend for now
            const filtered = res.data.filter(b => b.storeId === storeId && b.itemId === itemId);
            setBatches(filtered);
        } catch (error) {
            console.error("Error fetching batches:", error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createStockAdjustment({
                ...formData,
                actualQty: parseInt(formData.actualQty)
            });
            setShowModal(false);
            setFormData({
                storeId: '',
                inventoryItemId: '',
                batchNumber: '',
                actualQty: '',
                reason: 'SHRINKAGE',
                remarks: ''
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating adjustment');
        }
        setSubmitting(false);
    };

    return (
        <div>
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
                <div className="flex justify-center items-center h-64">
                    <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
                </div>
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
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">New Stock Adjustment</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                                <select 
                                    name="storeId" 
                                    value={formData.storeId} 
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                >
                                    <option value="">Select Store</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                                <select 
                                    name="inventoryItemId" 
                                    value={formData.inventoryItemId} 
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                >
                                    <option value="">Select Item</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                                <select 
                                    name="batchNumber" 
                                    value={formData.batchNumber} 
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.batchNumber}>{b.batchNumber} (Current: {b.quantityAvailable})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Physical Quantity</label>
                                <input 
                                    type="number" 
                                    name="actualQty"
                                    value={formData.actualQty}
                                    onChange={handleFormChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                    placeholder="Enter counted quantity"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <select 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                >
                                    <option value="SHRINKAGE">Shrinkage / Missing</option>
                                    <option value="BREAKAGE">Breakage / Damaged</option>
                                    <option value="EXPIRY">Expired</option>
                                    <option value="DATA_CORRECTION">Data Entry Correction</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                                <input 
                                    type="text" 
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-colors"
                                    placeholder="Any notes?"
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                >
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
