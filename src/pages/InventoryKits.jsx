import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Package, AlertCircle, MoreVertical } from 'lucide-react';
import { getKits, createKit, updateKit, deleteKit, consumeKit, getItems, getStores } from '../api/client';
import SearchableSelect from '../components/SearchableSelect';
import './InventoryKits.css';

const EMPTY_FORM = { name: '', code: '', description: '', patientBillingPrice: '', insuranceBillingPrice: '', components: [] };

export default function InventoryKits() {
    const [kits, setKits] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editingKit, setEditingKit] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [selectedKit, setSelectedKit] = useState(null);
    const [showConsumeModal, setShowConsumeModal] = useState(false);
    const [consumeForm, setConsumeForm] = useState({ storeId: '', quantity: '', force: false });
    const [lowStockWarning, setLowStockWarning] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [kitsRes, itemsRes, storesRes] = await Promise.all([
                getKits(),
                getItems(),
                getStores(),
            ]);
            setKits(Array.isArray(kitsRes.data) ? kitsRes.data : []);
            setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
            setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        } catch (e) {
            setError('Failed to load data. ' + (e.response?.data?.message || e.message));
            setKits([]);
            setItems([]);
            setStores([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingKit(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const handleEdit = (kit) => {
        setEditingKit(kit);
        setFormData({
            name: kit.name || '',
            code: kit.code || '',
            description: kit.description || '',
            patientBillingPrice: kit.patientBillingPrice || '',
            insuranceBillingPrice: kit.insuranceBillingPrice || '',
            components: (kit.components || []).map(c => ({
                itemId: c.item?.id || '',
                itemSearch: c.itemName || c.item?.name || '',
                quantity: c.quantity || '',
            })),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingKit(null);
        setFormData(EMPTY_FORM);
    };

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
        setFormData(prev => ({
            ...prev,
            components: prev.components.filter((_, i) => i !== idx),
        }));
    };

    const handleComponentChange = (idx, field, value) => {
        const next = [...formData.components];
        next[idx] = { ...next[idx], [field]: value };

        // Auto-clear itemId when user starts typing to enable dropdown again
        if (field === 'itemSearch' && next[idx].itemId && value !== next[idx].itemSearch) {
            next[idx].itemId = '';
        }

        setFormData(prev => ({ ...prev, components: next }));
    };

    const handleItemSelect = (idx, selectedItem) => {
        const next = [...formData.components];
        next[idx] = {
            ...next[idx],
            itemId: selectedItem.id,
            itemSearch: selectedItem.name,
        };
        setFormData(prev => ({ ...prev, components: next }));
    };

    const getFilteredItems = (searchText) => {
        if (!searchText) return [];
        return items.filter(i =>
            (i.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
            (i.code?.toLowerCase() || '').includes(searchText.toLowerCase())
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Kit name is required');
            return;
        }
        if (formData.components.length === 0) {
            alert('Add at least one component');
            return;
        }
        if (formData.components.some(c => !c.itemId || !c.quantity)) {
            alert('All components must have an item and quantity');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code || null,
                description: formData.description || null,
                patientBillingPrice: formData.patientBillingPrice ? Number(formData.patientBillingPrice) : null,
                insuranceBillingPrice: formData.insuranceBillingPrice ? Number(formData.insuranceBillingPrice) : null,
                components: formData.components.map(c => ({
                    itemId: c.itemId,
                    quantity: Number(c.quantity),
                })),
            };

            if (editingKit) {
                await updateKit(editingKit.id, payload);
            } else {
                await createKit(payload);
            }
            closeModal();
            await fetchData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (kit) => {
        if (!window.confirm(`Delete kit "${kit.name}"?`)) return;
        try {
            await deleteKit(kit.id);
            await fetchData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const openConsumeModal = (kit) => {
        setSelectedKit(kit);
        setConsumeForm({ storeId: '', quantity: '', force: false });
        setLowStockWarning(null);
        setShowConsumeModal(true);
    };

    const handleConsumeSubmit = async () => {
        if (!consumeForm.storeId || !consumeForm.quantity) {
            alert('Select store and enter quantity');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                storeId: consumeForm.storeId,
                quantity: Number(consumeForm.quantity),
                force: consumeForm.force,
            };

            const result = await consumeKit(selectedKit.id, payload);

            if (result.data?.status === 'LOW_STOCK_WARNING') {
                setLowStockWarning(result.data.lowStockItems);
                setConsumeForm(prev => ({ ...prev, force: false }));
            } else if (result.data?.status === 'SUCCESS') {
                setShowConsumeModal(false);
                setSelectedKit(null);
                await fetchData();
            }
        } catch (err) {
            if (err.response?.status === 409) {
                setLowStockWarning(err.response.data?.lowStockItems);
                setConsumeForm(prev => ({ ...prev, force: false }));
            } else {
                alert('Failed: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredKits = kits.filter(k =>
        (k.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (k.code?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (maxAssemblable) => {
        if (maxAssemblable === 0) return '#dc2626';
        if (maxAssemblable <= 2) return '#f59e0b';
        return '#10b981';
    };

    const getStatusLabel = (maxAssemblable) => {
        if (maxAssemblable === 0) return 'Out of Stock';
        if (maxAssemblable <= 2) return 'Low Stock';
        return 'Ready';
    };

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title"><Package size={26} /> Inventory Kits</h1>
                    <p className="page-subtitle">Create and manage item kits.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} />
                    Create Kit
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by kit name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
            </div>

            <div className="kit-layout">
            <div className="table-container kit-table-wrap">
                <div className="table-header">
                    <h3 className="table-title">Kits ({filteredKits.length})</h3>
                    <span className="text-muted kit-hint">Click a row to see components</span>
                </div>
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : filteredKits.length === 0 ? (
                        <div className="table-empty">
                            <p>No kits yet. Click "Create Kit" to add one.</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Kit Name</th>
                                    <th>Components</th>
                                    <th>Available</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKits.map((kit) => (
                                    <tr key={kit.id} onClick={() => setSelectedKit(selectedKit?.id === kit.id ? null : kit)} className={selectedKit?.id === kit.id ? 'active' : ''}>
                                        <td><span className="mono-sm">{kit.code || '-'}</span></td>
                                        <td><strong>{kit.name}</strong></td>
                                        <td>{kit.components?.length || 0} items</td>
                                        <td><strong style={{ color: getStatusColor(kit.maxAssemblable) }}>{kit.maxAssemblable || 0}</strong></td>
                                        <td><span className="badge" style={{ background: getStatusColor(kit.maxAssemblable) + '20', color: getStatusColor(kit.maxAssemblable) }}>{getStatusLabel(kit.maxAssemblable)}</span></td>
                                        <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === kit.id ? null : kit.id); }}
                                                className="app-btn-icon"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {activeDropdown === kit.id && (
                                                <div className="assets-dropdown">
                                                    <button onClick={(e) => { e.stopPropagation(); openConsumeModal(kit); }} className="assets-dropdown-item">
                                                        <Package size={16} style={{ color: '#8b5cf6' }} /> Consume
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(kit); }} className="assets-dropdown-item">
                                                        <Edit2 size={16} style={{ color: '#3b82f6' }} /> Edit
                                                    </button>
                                                    <div style={{ height: '1px', margin: '4px 0', background: '#f1f5f9' }} />
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(kit); }} className="assets-dropdown-item--danger">
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
                    <span className="table-info">Showing {filteredKits.length} of {kits.length} kits</span>
                </div>
            </div>

            {/* Inline side panel for selected kit (matches StockOverview pattern) */}
            {selectedKit && !showConsumeModal && (
                <div className="kit-panel">
                    <div className="kit-panel-header">
                        <div>
                            <div className="kit-panel-name">{selectedKit.name}</div>
                            <div className="kit-panel-meta">
                                {selectedKit.code ? <span className="mono-sm">{selectedKit.code}</span> : null}
                                {selectedKit.code && (selectedKit.components?.length > 0) ? ' · ' : ''}
                                {selectedKit.components?.length || 0} component{(selectedKit.components?.length || 0) !== 1 ? 's' : ''}
                            </div>
                            <div className="kit-panel-stats">
                                <div>
                                    <div className="kit-stat-label">Available</div>
                                    <div
                                        className="kit-stat-value"
                                        style={{ color: getStatusColor(selectedKit.maxAssemblable) }}
                                    >
                                        {selectedKit.maxAssemblable || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="kit-stat-label">Status</div>
                                    <div
                                        className="kit-stat-value-sm"
                                        style={{ color: getStatusColor(selectedKit.maxAssemblable) }}
                                    >
                                        {getStatusLabel(selectedKit.maxAssemblable)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="kit-panel-close" onClick={() => setSelectedKit(null)}>
                            <X size={18} />
                        </button>
                    </div>
                    <div className="kit-panel-section-title">Components</div>
                    <div className="kit-panel-scroll">
                        {selectedKit.components && selectedKit.components.length > 0 ? (
                            <table className="detail-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Per Kit</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedKit.components.map((comp, idx) => (
                                        <tr key={idx}>
                                            <td>{comp.itemName}</td>
                                            <td>{comp.quantity}</td>
                                            <td>{comp.currentStock || 0}</td>
                                            <td>
                                                {comp.currentStock >= comp.quantity ? (
                                                    <span className="badge kit-badge-ok">OK</span>
                                                ) : (
                                                    <span className="badge kit-badge-low">Low</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="kit-panel-empty">No components</p>
                        )}
                    </div>
                </div>
            )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '680px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingKit ? 'Edit Kit' : 'Create Kit'}</h2>
                            <button className="modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748b' }}>Basic Info</h4>
                                    <div className="form-group">
                                        <label className="form-label">Kit Name *</label>
                                        <input
                                            className="form-input"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Code</label>
                                        <input
                                            className="form-input"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="e.g. SK-001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <input
                                            className="form-input"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Optional description"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Patient Billing Price</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                step="0.01"
                                                name="patientBillingPrice"
                                                value={formData.patientBillingPrice}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Insurance Billing Price</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                step="0.01"
                                                name="insuranceBillingPrice"
                                                value={formData.insuranceBillingPrice}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
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
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                right: 0,
                                                                background: '#fff',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '6px',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                zIndex: 100,
                                                                maxHeight: '250px',
                                                                overflowY: 'auto',
                                                                marginTop: '2px'
                                                            }}>
                                                                {filtered.map(item => (
                                                                    <div
                                                                        key={item.id}
                                                                        onMouseDown={() => handleItemSelect(idx, item)}
                                                                        style={{
                                                                            padding: '10px 12px',
                                                                            cursor: 'pointer',
                                                                            borderBottom: '1px solid #f0f0f0',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        <div>
                                                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</div>
                                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.code}</div>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '60px', textAlign: 'right' }}>
                                                                            {(() => {
                                                                                const stock = formData.components
                                                                                    .map((c, i) => ({ itemId: c.itemId, idx: i }))
                                                                                    .filter(c => c.itemId === item.id && c.idx !== idx);
                                                                                return stock.length > 0 ? '⚠️ Used' : '✓';
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {comp.itemSearch && !isSelected && filtered.length === 0 && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                right: 0,
                                                                background: '#fff',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '6px',
                                                                padding: '10px 12px',
                                                                fontSize: '0.85rem',
                                                                color: '#94a3b8',
                                                                zIndex: 100,
                                                                marginTop: '2px'
                                                            }}>
                                                                No items found
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const next = [...formData.components];
                                                                    next[idx] = { ...next[idx], itemId: '', itemSearch: '' };
                                                                    setFormData(prev => ({ ...prev, components: next }));
                                                                }}
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: '8px',
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: '#10b981',
                                                                    fontSize: '1.2rem',
                                                                    padding: '0 4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
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
                                    <button
                                        type="button"
                                        onClick={handleAddComponent}
                                        className="btn btn-sm btn-secondary"
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        <Plus size={14} /> Add Component
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Kit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Consume Modal */}
            {showConsumeModal && selectedKit && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '580px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Consume Kit — {selectedKit.name}</h2>
                            <button className="modal-close" onClick={() => setShowConsumeModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {lowStockWarning && (
                                <div style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', fontSize: '0.9rem', color: '#92400e' }}>
                                    <strong>⚠️ Low Stock Warning</strong><br />
                                    Some items have insufficient stock:
                                    <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                                        {lowStockWarning.map((item, idx) => (
                                            <li key={idx}><strong>{item.itemName}</strong>: needs {item.needed}, have {item.available}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Store *</label>
                                <SearchableSelect
                                    value={consumeForm.storeId}
                                    onChange={v => setConsumeForm(prev => ({ ...prev, storeId: v }))}
                                    options={stores}
                                    getId={s => s.id}
                                    getLabel={s => s.name}
                                    placeholder="Select Store"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity to Consume *</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={consumeForm.quantity}
                                    onChange={(e) => setConsumeForm(prev => ({ ...prev, quantity: e.target.value }))}
                                />
                            </div>

                            {selectedKit.components && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600' }}>Component Breakdown</h4>
                                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item</th>
                                                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Needed</th>
                                                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Available</th>
                                                <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedKit.components.map((comp, idx) => {
                                                const needed = consumeForm.quantity ? Number(consumeForm.quantity) * Number(comp.quantity) : 0;
                                                const available = comp.currentStock || 0;
                                                const isOk = available >= needed;
                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ padding: '0.5rem 0' }}>{comp.itemName}</td>
                                                        <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>
                                                            {needed}
                                                            <span className="kit-needed-per-kit">({comp.quantity}/kit)</span>
                                                        </td>
                                                        <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{available}</td>
                                                        <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                                            {isOk ? (
                                                                <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                                                            ) : (
                                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>✗</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {lowStockWarning && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={consumeForm.force}
                                        onChange={(e) => setConsumeForm(prev => ({ ...prev, force: e.target.checked }))}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>Proceed anyway (deduct available quantity)</span>
                                </label>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowConsumeModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConsumeSubmit}
                                disabled={submitting || !consumeForm.storeId || !consumeForm.quantity || (lowStockWarning && !consumeForm.force)}
                            >
                                {submitting ? 'Processing...' : 'Confirm Consumption'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
