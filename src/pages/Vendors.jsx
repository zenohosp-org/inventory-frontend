import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api/client';


export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        isActive: true
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await getVendors();
            let vendorsData = res.data || res;
            // If data is a JSON string, parse it
            if (typeof vendorsData === 'string') {
                vendorsData = JSON.parse(vendorsData);
            }
            vendorsData = Array.isArray(vendorsData) ? vendorsData : [];
            setVendors(vendorsData);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            setVendors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vendor = null) => {
        if (vendor) {
            setEditingId(vendor.id);
            setFormData({
                name: vendor.name,
                contactName: vendor.contactName || '',
                phone: vendor.phone || '',
                email: vendor.email || '',
                address: vendor.address || '',
                city: vendor.city || '',
                isActive: vendor.isActive !== false
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                contactName: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateVendor(editingId, formData);
            } else {
                await createVendor(formData);
            }
            setShowModal(false);
            fetchVendors();
        } catch (error) {
            console.error('Error saving vendor:', error);
            alert('Failed to save vendor');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await deleteVendor(id);
                fetchVendors();
            } catch (error) {
                console.error('Error deleting vendor:', error);
                alert('Failed to delete vendor');
            }
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'badge-success' : 'badge-warning';
    };

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="flex page-title" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <Users size={28} style={{ color: 'var(--color-accent)' }} />
                    Vendors Master
                </h1>
                <p className="page-subtitle">
                    Manage suppliers and vendor information for purchase orders.
                </p>
            </div>

            {/* Page Actions */}
            <div className="page-actions">
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Vendor
                </button>
            </div>

            {/* Vendors Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Vendors ({vendors.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : vendors.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No vendors found. Add your first vendor to get started.
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '25%' }}>Vendor Name</th>
                                    <th style={{ width: '20%' }}>Contact Person</th>
                                    <th style={{ width: '20%' }}>Phone / Email</th>
                                    <th style={{ width: '20%' }}>Location</th>
                                    <th style={{ width: '10%' }}>Status</th>
                                    <th style={{ width: '5%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id}>
                                        <td>
                                            <strong>{vendor.name}</strong>
                                        </td>
                                        <td className="text-muted">
                                            {vendor.contactName || '-'}
                                        </td>
                                        <td className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
                                            <div>{vendor.phone || '-'}</div>
                                            <div style={{ color: 'var(--color-gray-400)', fontSize: 'var(--fs-xs)' }}>
                                                {vendor.email || '-'}
                                            </div>
                                        </td>
                                        <td className="text-muted">
                                            {vendor.city || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusColor(vendor.isActive)}`}>
                                                {vendor.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{
                                                display: 'flex',
                                                gap: 'var(--spacing-2)'
                                            }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleOpenModal(vendor)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(vendor.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span className="table-info">
                        Total: {vendors.length} vendors
                    </span>
                </div>
            </div>

            {/* Vendor Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingId ? 'Edit Vendor' : 'Add New Vendor'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Vendor Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., ABC Pharmaceuticals Ltd."
                                        required
                                    />
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--spacing-4)'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">Contact Person</label>
                                        <input
                                            type="text"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            className="form-input"
                                            placeholder="Name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="form-input"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="form-input"
                                        placeholder="vendor@example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="form-textarea"
                                        placeholder="Street address"
                                        rows="2"
                                    ></textarea>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--spacing-4)'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="form-input"
                                            placeholder="City"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-2)',
                                            cursor: 'pointer',
                                            fontWeight: 'var(--fw-medium)',
                                            color: 'var(--color-gray-700)'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            Mark as Active
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Vendor' : 'Create Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
