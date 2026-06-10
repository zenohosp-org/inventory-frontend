import { X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import { CONTRACT_TYPES, VISIT_FREQUENCIES } from '../utils/contractHelpers';

const TITLES = { create: 'New Contract', edit: 'Edit Contract', renew: 'Renew Contract' };
const SUBMIT_LABELS = { create: 'Create Contract', edit: 'Update Contract', renew: 'Renew Contract' };

export default function ContractFormModal({
    mode, formData, assets, vendors, saving,
    setField, setSelect, onSubmit, onClose,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="modal-overlay active">
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h2 className="modal-title">{TITLES[mode]}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label required">Asset</label>
                            <SearchableSelect
                                value={formData.assetId}
                                onChange={(id) => setSelect('assetId', id)}
                                options={assets}
                                getId={(a) => a.assetId}
                                getLabel={(a) => `${a.assetName}${a.assetCode ? ` (${a.assetCode})` : ''}`}
                                placeholder="Search asset..."
                                required
                                disabled={mode !== 'create'}
                            />
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label required">Contract Type</label>
                                <select className="form-input" value={formData.contractType}
                                    onChange={setField('contractType')} required>
                                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Vendor</label>
                                <SearchableSelect
                                    value={formData.vendorId}
                                    onChange={(id) => setSelect('vendorId', id)}
                                    options={vendors}
                                    getId={(v) => v.id}
                                    getLabel={(v) => v.name}
                                    placeholder="Search vendor..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label">Contract Number</label>
                                <input type="text" className="form-input" value={formData.contractNumber}
                                    onChange={setField('contractNumber')} placeholder="e.g., AMC-2026-001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">Visit Frequency</label>
                                <select className="form-input" value={formData.visitFrequency}
                                    onChange={setField('visitFrequency')} required>
                                    {VISIT_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label required">Start Date</label>
                                <input type="date" className="form-input" value={formData.startDate}
                                    onChange={setField('startDate')} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">End Date</label>
                                <input type="date" className="form-input" value={formData.endDate}
                                    onChange={setField('endDate')} required />
                            </div>
                        </div>

                        <div className="form-2col">
                            <div className="form-group">
                                <label className="form-label">Contract Value (₹)</label>
                                <input type="number" step="0.01" min="0" className="form-input" value={formData.contractValue}
                                    onChange={setField('contractValue')} placeholder="0.00" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alert Before (days)</label>
                                <input type="number" min="0" className="form-input" value={formData.autoAlertDays}
                                    onChange={setField('autoAlertDays')} placeholder="30" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Coverage Details</label>
                            <textarea className="form-textarea" value={formData.coverageDetails}
                                onChange={setField('coverageDetails')} placeholder="What the contract covers..." rows="2" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : SUBMIT_LABELS[mode]}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
