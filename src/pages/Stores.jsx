import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Plus, Edit2, Trash2, X, Eye, MoreVertical } from 'lucide-react';
import { getStores, createStore, updateStore, deleteStore } from '../api/client';
import { invalidate } from '../cache';

export default function Stores() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'CENTRAL',
        isActive: true
    });
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchStores = async () => {
        setLoading(true);
        try {
            const response = await getStores();
            let storesData = response.data || response;
            if (typeof storesData === 'string') {
                storesData = JSON.parse(storesData);
            }
            storesData = Array.isArray(storesData) ? storesData : [];
            setStores(storesData);
        } catch (error) {
            console.error('Error fetching stores:', error);
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (store = null) => {
        if (store) {
            setEditingId(store.id);
            setFormData({
                name: store.name,
                description: store.description || '',
                type: store.type || 'CENTRAL',
                isActive: store.isActive !== false
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                type: 'CENTRAL',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateStore(editingId, formData);
            } else {
                await createStore(formData);
            }
            invalidate('stores');
            setShowModal(false);
            fetchStores();
        } catch (error) {
            console.error('Error saving store:', error);
            alert('Failed to save store');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this store?')) {
            try {
                await deleteStore(id);
                invalidate('stores');
                fetchStores();
            } catch (error) {
                console.error('Error deleting store:', error);
                alert('Failed to delete store');
            }
        }
    };

    const getStoreTypeColor = (type) => {
        const colors = {
            'CENTRAL': 'badge-primary',
            'DEPARTMENT': 'badge-info',
            'EMERGENCY': 'badge-warning'
        };
        return colors[type] || 'badge-secondary';
    };

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <Store size={26} />
                        Stores Master
                    </h1>
                    <p className="page-subtitle">
                        Create and manage hospital stores and storage locations.
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Add Store
                    </button>
                </div>
            </div>

            {/* Stores Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Stores ({stores.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : stores.length === 0 ? (
                        <div className="table-empty">No stores found. Create your first store to get started.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Store Name</th>
                                    <th>Location</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((store) => (
                                    <tr key={store.id}>
                                        <td>
                                            <strong>{store.name}</strong>
                                        </td>
                                        <td className="text-muted">
                                            {store.location || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStoreTypeColor(store.type)}`}>
                                                {store.type || 'CENTRAL'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${store.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                {store.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-muted">
                                            {store.description || '-'}
                                        </td>
                                        <td style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === store.id ? null : store.id); }}
                                                className="app-btn-icon"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {activeDropdown === store.id && (
                                                <div className="assets-dropdown">
                                                    <Link
                                                        to={`/stores/${store.id}`}
                                                        className="assets-dropdown-item"
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <Eye size={16} style={{ color: '#10b981' }} /> View Details
                                                    </Link>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(store); }} className="assets-dropdown-item">
                                                        <Edit2 size={16} style={{ color: '#3b82f6' }} /> Edit
                                                    </button>
                                                    <div style={{ height: '1px', margin: '4px 0', background: '#f1f5f9' }} />
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(store.id); }} className="assets-dropdown-item--danger">
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span className="table-info">
                        Total: {stores.length} stores
                    </span>
                </div>
            </div>

            {/* Store Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingId ? 'Edit Store' : 'Add New Store'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Store Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Central Pharmacy"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Store Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="GENERAL">General</option>
                                        <option value="CENTRAL">Central</option>
                                        <option value="DEPARTMENT">Department</option>
                                        <option value="EMERGENCY">Emergency</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-textarea"
                                        placeholder="Any additional notes about this store"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        Active Store (Available for purchase orders)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Store' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
