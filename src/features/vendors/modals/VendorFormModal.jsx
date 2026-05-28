import { X } from 'lucide-react';
import { GST_TYPES } from '../utils/vendorHelpers';

export default function VendorFormModal({
    editingId, formData, stateAutoFilled,
    setField, handleGstChange, setActive,
    onSubmit, onClose,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="modal-overlay active">
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2 className="modal-title">{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label required">Vendor Name</label>
                            <input type="text" className="form-input" value={formData.name}
                                onChange={setField('name')} placeholder="e.g., ABC Pharmaceuticals Ltd." required />
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label">Contact Person</label>
                                <input type="text" className="form-input" value={formData.contactName}
                                    onChange={setField('contactName')} placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" className="form-input" value={formData.phone}
                                    onChange={setField('phone')} placeholder="+91 98765 43210" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email ID</label>
                            <input type="email" className="form-input" value={formData.email}
                                onChange={setField('email')} placeholder="vendor@example.com" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">GST Registration Type</label>
                            <select className="form-input" value={formData.gstRegistrationType}
                                onChange={setField('gstRegistrationType')}>
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
                                    onChange={handleGstChange} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PAN Number</label>
                                <input type="text" className="form-input" value={formData.panNumber}
                                    onChange={setField('panNumber')} placeholder="AAAAA0000A" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea className="form-textarea" value={formData.address}
                                onChange={setField('address')} placeholder="Street address" rows="2" />
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input type="text" className="form-input" value={formData.city}
                                    onChange={setField('city')} placeholder="City" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    State {stateAutoFilled && <span className="form-label-hint">(auto-filled from GST)</span>}
                                </label>
                                <input
                                    type="text"
                                    className={`form-input ${stateAutoFilled ? 'is-readonly' : ''}`}
                                    value={formData.state}
                                    readOnly={stateAutoFilled}
                                    onChange={stateAutoFilled ? undefined : setField('state')}
                                    placeholder="State"
                                />
                            </div>
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label">Pincode</label>
                                <input type="text" className="form-input" value={formData.pincode}
                                    onChange={setField('pincode')} placeholder="600001" maxLength={6} />
                            </div>
                            <div className="form-group form-group--center">
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={formData.isActive}
                                        onChange={(e) => setActive(e.target.checked)} />
                                    Mark as Active
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update Vendor' : 'Create Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
