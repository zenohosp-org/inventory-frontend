import { X, Plus, Trash2 } from 'lucide-react';

export default function KitFormModal({
    editingKit, formData, setFormData,
    items, submitting,
    onSubmit, onClose,
}) {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddComponent = () => {
        setFormData(prev => ({
            ...prev,
            components: [...prev.components, { itemId: '', itemSearch: '', quantity: '' }],
        }));
    };

    const handleRemoveComponent = (idx) => {
        setFormData(prev => ({ ...prev, components: prev.components.filter((_, i) => i !== idx) }));
    };

    const handleComponentChange = (idx, field, value) => {
        const next = [...formData.components];
        next[idx] = { ...next[idx], [field]: value };
        // Auto-clear itemId when the user re-types so the dropdown re-opens.
        if (field === 'itemSearch' && next[idx].itemId && value !== next[idx].itemSearch) {
            next[idx].itemId = '';
        }
        setFormData(prev => ({ ...prev, components: next }));
    };

    const handleItemSelect = (idx, selectedItem) => {
        const next = [...formData.components];
        next[idx] = { ...next[idx], itemId: selectedItem.id, itemSearch: selectedItem.name };
        setFormData(prev => ({ ...prev, components: next }));
    };

    const clearItem = (idx) => {
        const next = [...formData.components];
        next[idx] = { ...next[idx], itemId: '', itemSearch: '' };
        setFormData(prev => ({ ...prev, components: next }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ maxWidth: '680px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{editingKit ? 'Edit Kit' : 'Create Kit'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748b' }}>Basic Info</h4>
                            <div className="form-group">
                                <label className="form-label">Kit Name *</label>
                                <input className="form-input" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Code</label>
                                <input className="form-input" name="code" value={formData.code} onChange={handleInputChange} placeholder="e.g. SK-001" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional description" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Patient Billing Price</label>
                                    <input className="form-input" type="number" step="0.01" name="patientBillingPrice" value={formData.patientBillingPrice} onChange={handleInputChange} placeholder="0.00" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Insurance Billing Price</label>
                                    <input className="form-input" type="number" step="0.01" name="insuranceBillingPrice" value={formData.insuranceBillingPrice} onChange={handleInputChange} placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748b' }}>Kit Components</h4>
                            {formData.components.map((comp, idx) => {
                                const filtered = items.filter(i =>
                                    (i.name?.toLowerCase() || '').includes((comp.itemSearch || '').toLowerCase()) ||
                                    (i.code?.toLowerCase() || '').includes((comp.itemSearch || '').toLowerCase())
                                );
                                const isSelected = comp.itemId !== '';

                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '2', minWidth: '150px', position: 'relative' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Item *</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="form-input"
                                                    type="text"
                                                    value={comp.itemSearch || ''}
                                                    onChange={(e) => handleComponentChange(idx, 'itemSearch', e.target.value)}
                                                    placeholder="Search by name or code..."
                                                    autoComplete="off"
                                                    style={{
                                                        borderColor: isSelected ? '#10b981' : undefined,
                                                        borderWidth: isSelected ? '2px' : undefined,
                                                        paddingRight: isSelected ? '32px' : undefined,
                                                    }}
                                                />
                                                {!isSelected && filtered.length > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
                                                        maxHeight: '250px', overflowY: 'auto', marginTop: '2px',
                                                    }}>
                                                        {filtered.map(item => {
                                                            const usedElsewhere = formData.components
                                                                .map((c, i) => ({ itemId: c.itemId, idx: i }))
                                                                .some(c => c.itemId === item.id && c.idx !== idx);
                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    onMouseDown={() => handleItemSelect(idx, item)}
                                                                    style={{
                                                                        padding: '10px 12px', cursor: 'pointer',
                                                                        borderBottom: '1px solid #f0f0f0',
                                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.code}</div>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '60px', textAlign: 'right' }}>
                                                                        {usedElsewhere ? '⚠️ Used' : '✓'}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {comp.itemSearch && !isSelected && filtered.length === 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
                                                        padding: '10px 12px', fontSize: '0.85rem', color: '#94a3b8',
                                                        zIndex: 100, marginTop: '2px',
                                                    }}>
                                                        No items found
                                                    </div>
                                                )}
                                                {isSelected && (
                                                    <button
                                                        type="button"
                                                        onClick={() => clearItem(idx)}
                                                        style={{
                                                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#10b981', fontSize: '1.2rem', padding: '0 4px',
                                                            display: 'flex', alignItems: 'center',
                                                        }}
                                                        title="Clear selection"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ flex: '1', minWidth: '80px' }}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty Per Kit *</label>
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="0.1"
                                                className="form-input"
                                                value={comp.quantity}
                                                onChange={(e) => handleComponentChange(idx, 'quantity', e.target.value)}
                                                required
                                                placeholder="0.1"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveComponent(idx)}
                                            className="btn btn-sm btn-danger"
                                            style={{ marginBottom: '0' }}
                                            title="Remove component"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            <button type="button" onClick={handleAddComponent} className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}>
                                <Plus size={14} /> Add Component
                            </button>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Kit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
