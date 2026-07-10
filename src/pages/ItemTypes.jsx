import { useState, useEffect } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { getItemTypes, createItemType } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';

const EMPTY_FORM = {
    name: '',
    defaultBatchRequired: false,
    defaultExpiryRequired: false,
    defaultBillingGroup: '',
};

export default function ItemTypes() {
    const { toast } = useToast();
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getItemTypes();
            let data = res.data || res;
            if (typeof data === 'string') data = JSON.parse(data);
            setItemTypes(Array.isArray(data) ? data : []);
        } catch {
            setItemTypes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createItemType(formData);
            setShowModal(false);
            setFormData(EMPTY_FORM);
            fetchData();
            toast.success('Item type created');
        } catch {
            toast.error('Failed to create item type');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <Tag size={26} /> Item Types
                    </>
                }
                subtitle="Define item categories and their default inventory behavior."
                actions={
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Add Item Type
                    </button>
                }
            />
            <div className="zu-page-content">


            <div className="zu-table-wrapper">
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : itemTypes.length === 0 ? (
                        <div className="table-empty">No item types found.</div>
                    ) : (
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Routing</th>
                                    <th>Batch</th>
                                    <th>Expiry</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemTypes.map(type => (
                                    <tr key={type.id}>
                                        <td><strong>{type.name}</strong></td>
                                        <td>
                                            {type.defaultBillingGroup
                                                ? <span className="badge badge-info">{type.defaultBillingGroup}</span>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td>{type.defaultBatchRequired ? '✓' : '—'}</td>
                                        <td>{type.defaultExpiryRequired ? '✓' : '—'}</td>
                                        <td>
                                            <span className={`badge ${type.isSystem ? 'badge-primary' : 'badge-secondary'}`}>
                                                {type.isSystem ? 'System' : 'Custom'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal modal-sm">
                        <div className="modal-header">
                            <h2 className="modal-title">Add Item Type</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); setFormData(EMPTY_FORM); }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Type Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Drug, Implant"
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Routes to Module</label>
                                    <select
                                        className="form-select"
                                        value={formData.defaultBillingGroup}
                                        onChange={e => setFormData(p => ({ ...p, defaultBillingGroup: e.target.value }))}
                                    >
                                        <option value="">None (General Inventory)</option>
                                        <option value="PHARMACY">Pharmacy</option>
                                        <option value="ASSET">Asset</option>
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Items of this type will automatically appear in the selected module.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.defaultBatchRequired}
                                            onChange={e => setFormData(p => ({ ...p, defaultBatchRequired: e.target.checked }))}
                                        />
                                        <span className="form-label" style={{ margin: 0 }}>Batch required by default</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.defaultExpiryRequired}
                                            onChange={e => setFormData(p => ({ ...p, defaultExpiryRequired: e.target.checked }))}
                                        />
                                        <span className="form-label" style={{ margin: 0 }}>Expiry required by default</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setFormData(EMPTY_FORM); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!formData.name.trim() || saving}>
                                    {saving ? 'Saving...' : 'Add Type'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
                    </div>
        </div>
    );
}
