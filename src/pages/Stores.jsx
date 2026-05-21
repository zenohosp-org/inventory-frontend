import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Plus, Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';
import { getStores, createStore, updateStore, deleteStore, getHmsInfrastructure } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { invalidate } from '../cache';

export default function Stores() {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'INVENTORY',
        isActive: true
    });
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [hmsLoading, setHmsLoading] = useState(false);
    const [hmsError, setHmsError] = useState(false);
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
            let data = response.data || response;
            if (typeof data === 'string') data = JSON.parse(data);
            setStores(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching stores:', error);
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = async () => {
        setEditingStore(null);
        setFormData({ name: '', type: 'INVENTORY', isActive: true });
        setSelectedBuilding(null);
        setSelectedFloor(null);
        setHmsError(false);
        setShowModal(true);

        setHmsLoading(true);
        try {
            const res = await getHmsInfrastructure(user.hospitalId);
            const data = res.data || res;
            setBuildings(Array.isArray(data) ? data : []);
        } catch {
            setHmsError(true);
            setBuildings([]);
        } finally {
            setHmsLoading(false);
        }
    };

    const openEditModal = (store) => {
        setEditingStore(store);
        setFormData({ name: store.name, isActive: store.isActive !== false });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingStore) {
                await updateStore(editingStore.id, { name: formData.name, isActive: formData.isActive });
            } else {
                await createStore({
                    name: formData.name,
                    type: formData.type,
                    isActive: formData.isActive,
                    buildingId: selectedBuilding?.id ?? null,
                    buildingName: selectedBuilding?.name ?? null,
                    floorId: selectedFloor?.id ?? null,
                    floorName: selectedFloor?.name ?? null,
                });
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
        if (type === 'PHARMACY') return 'badge-info';
        if (type === 'INVENTORY') return 'badge-primary';
        return 'badge-secondary';
    };

    const floors = selectedBuilding?.floors ?? [];

    return (
        <div className="main-content">
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
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        Add Store
                    </button>
                </div>
            </div>

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
                                    <th>Type</th>
                                    <th>Block</th>
                                    <th>Floor</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((store) => (
                                    <tr key={store.id}>
                                        <td><strong>{store.name}</strong></td>
                                        <td>
                                            <span className={`badge ${getStoreTypeColor(store.type)}`}>
                                                {store.type || '—'}
                                            </span>
                                        </td>
                                        <td className="text-muted">{store.buildingName || '—'}</td>
                                        <td className="text-muted">{store.floorName || '—'}</td>
                                        <td>
                                            <span className={`badge ${store.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                {store.isActive ? 'Active' : 'Inactive'}
                                            </span>
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
                                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(store); }} className="assets-dropdown-item">
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
                    <span className="table-info">Total: {stores.length} stores</span>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingStore ? 'Edit Store' : 'Add New Store'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {/* Create-only: Block & Floor from HMS */}
                                {!editingStore && (
                                    <>
                                        {hmsLoading && (
                                            <div className="form-group">
                                                <p className="form-help">Loading infrastructure from HMS…</p>
                                            </div>
                                        )}
                                        {hmsError && (
                                            <div className="form-group">
                                                <p className="form-help" style={{ color: '#f59e0b' }}>
                                                    Could not load HMS infrastructure. You can still save without a location.
                                                </p>
                                            </div>
                                        )}
                                        {!hmsLoading && buildings.length > 0 && (
                                            <>
                                                <div className="form-group">
                                                    <label className="form-label">Block (Building)</label>
                                                    <select
                                                        className="form-select"
                                                        value={selectedBuilding?.id ?? ''}
                                                        onChange={(e) => {
                                                            const b = buildings.find(b => String(b.id) === e.target.value) || null;
                                                            setSelectedBuilding(b);
                                                            setSelectedFloor(null);
                                                        }}
                                                    >
                                                        <option value="">— Select Block —</option>
                                                        {buildings.map(b => (
                                                            <option key={b.id} value={b.id}>{b.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Floor</label>
                                                    <select
                                                        className="form-select"
                                                        value={selectedFloor?.id ?? ''}
                                                        onChange={(e) => {
                                                            const f = floors.find(f => String(f.id) === e.target.value) || null;
                                                            setSelectedFloor(f);
                                                        }}
                                                        disabled={!selectedBuilding}
                                                    >
                                                        <option value="">— Select Floor —</option>
                                                        {floors.map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        <div className="form-group">
                                            <label className="form-label required">Store Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="form-select"
                                                required
                                            >
                                                <option value="INVENTORY">Inventory Store</option>
                                                <option value="PHARMACY">Pharmacy Store</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label required">Store Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Ground Floor Pharmacy"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        Active Store
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingStore ? 'Update Store' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
