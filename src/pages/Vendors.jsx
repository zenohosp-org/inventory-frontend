import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api/client';

const GST_TYPES = ['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER', 'OVERSEAS'];

const EMPTY_FORM = {
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstRegistrationType: '',
    gstNumber: '',
    panNumber: '',
    isActive: true,
};

export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await getVendors();
            let data = res.data || res;
            if (typeof data === 'string') data = JSON.parse(data);
            setVendors(Array.isArray(data) ? data : []);
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
                name: vendor.name || '',
                contactName: vendor.contactName || '',
                phone: vendor.phone || '',
                email: vendor.email || '',
                address: vendor.address || '',
                city: vendor.city || '',
                state: vendor.state || '',
                pincode: vendor.pincode || '',
                gstRegistrationType: vendor.gstRegistrationType || '',
                gstNumber: vendor.gstNumber || '',
                panNumber: vendor.panNumber || '',
                isActive: vendor.isActive !== false,
            });
        } else {
            setEditingId(null);
            setFormData(EMPTY_FORM);
        }
        setShowModal(true);
    };

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

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
        if (!window.confirm('Delete this vendor?')) return;
        try {
            await deleteVendor(id);
            fetchVendors();
        } catch (error) {
            alert('Failed to delete vendor');
        }
    };

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title"><Users size={26} /> Vendors Master</h1>
                <p className="page-subtitle">Manage suppliers and vendor information for purchase orders.</p>
            </div>

            <div className="page-actions">
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Vendor
                </button>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Vendors ({vendors.length})</h3>
                </div>
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : vendors.length === 0 ? (
                        <div className="table-empty">No vendors found. Add your first vendor to get started.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Vendor Name</th>
                                    <th>Contact Person</th>
                                    <th>Phone / Email</th>
                                    <th>GST Type</th>
                                    <th>GST / PAN</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map((v) => (
                                    <tr key={v.id}>
                                        <td><strong>{v.name}</strong></td>
                                        <td className="text-muted">{v.contactName || '-'}</td>
                                        <td className="text-muted">
                                            <div>{v.phone || '-'}</div>
                                            <span className="subtext">{v.email || '-'}</span>
                                        </td>
                                        <td className="text-muted">
                                            {v.gstRegistrationType
                                                ? <span className="badge badge-secondary">{v.gstRegistrationType}</span>
                                                : '-'}
                                        </td>
                                        <td className="text-muted mono">
                                            <div>{v.gstNumber || '-'}</div>
                                            <span className="subtext">{v.panNumber || '-'}</span>
                                        </td>
                                        <td className="text-muted">
                                            {[v.city, v.state, v.pincode].filter(Boolean).join(', ') || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${v.isActive !== false ? 'badge-success' : 'badge-warning'}`}>
                                                {v.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleOpenModal(v)} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v.id)} title="Delete">
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
                    <span className="table-info">Total: {vendors.length} vendors</span>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Vendor Name</label>
                                    <input type="text" className="form-input" value={formData.name}
                                        onChange={set('name')} placeholder="e.g., ABC Pharmaceuticals Ltd." required />
                                </div>

                                <div className="form-2col">
                                    <div className="form-group">
                                        <label className="form-label">Contact Person</label>
                                        <input type="text" className="form-input" value={formData.contactName}
                                            onChange={set('contactName')} placeholder="Full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" className="form-input" value={formData.phone}
                                            onChange={set('phone')} placeholder="+91 98765 43210" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email ID</label>
                                    <input type="email" className="form-input" value={formData.email}
                                        onChange={set('email')} placeholder="vendor@example.com" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">GST Registration Type</label>
                                    <select className="form-input" value={formData.gstRegistrationType}
                                        onChange={set('gstRegistrationType')}>
                                        <option value="">Select type...</option>
                                        {GST_TYPES.map(t => (
                                            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-2col">
                                    <div className="form-group">
                                        <label className="form-label">GST Number</label>
                                        <input type="text" className="form-input" value={formData.gstNumber}
                                            onChange={set('gstNumber')} placeholder="22AAAAA0000A1Z5" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PAN Number</label>
                                        <input type="text" className="form-input" value={formData.panNumber}
                                            onChange={set('panNumber')} placeholder="AAAAA0000A" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea className="form-textarea" value={formData.address}
                                        onChange={set('address')} placeholder="Street address" rows="2"></textarea>
                                </div>

                                <div className="form-2col">
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input type="text" className="form-input" value={formData.city}
                                            onChange={set('city')} placeholder="City" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <input type="text" className="form-input" value={formData.state}
                                            onChange={set('state')} placeholder="State" />
                                    </div>
                                </div>

                                <div className="form-2col">
                                    <div className="form-group">
                                        <label className="form-label">Pincode</label>
                                        <input type="text" className="form-input" value={formData.pincode}
                                            onChange={set('pincode')} placeholder="600001" maxLength={6} />
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={formData.isActive}
                                                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
                                            Mark as Active
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
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
