import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { getItems, getCategories, createItem, updateItem, deleteItem, getItemTypes } from '../api/client';

const GST_OPTIONS = [0, 5, 12, 18, 28];

const EMPTY_FORM = {
    name: '',
    code: '',
    description: '',
    categoryId: '',
    unit: 'Piece',
    packSize: '',
    reorderLevel: 5,
    gstPercent: 0,
    itemTypeId: '',
    purchasePrice: '',
    sellingPrice: '',
    billable: 'NO',
    billingGroup: 'PHARMACY',
    consumptionType: 'AUTO_CONSUME',
    batchRequired: false,
    expiryRequired: false,
    serialRequired: false,
};

const BILLABLE_LABEL = { YES: 'Yes', NO: 'No', CONDITIONAL: 'Conditional' };
const CONSUMPTION_LABEL = { AUTO_CONSUME: 'Auto-consume', RETURNABLE: 'Returnable', ASSIGN_ONLY: 'Assign-only' };

function generateCode(name, items) {
    const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    if (!prefix) return '';
    const count = items.filter(i => i.code?.startsWith(prefix + '-')).length;
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export default function InventoryItems() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catsRes, typesRes] = await Promise.all([getItems(), getCategories(), getItemTypes()]);
            const parse = (r) => { let d = r.data || r; if (typeof d === 'string') d = JSON.parse(d); return Array.isArray(d) ? d : []; };
            setItems(parse(itemsRes));
            setCategories(parse(catsRes));
            setItemTypes(parse(typesRes));
        } catch {
            setItems([]); setCategories([]); setItemTypes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            ...(editingItem ? {} : { code: generateCode(name, items) }),
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleItemTypeSelect = (type) => {
        setFormData(prev => ({
            ...prev,
            itemTypeId: type.id,
            billable: type.defaultBillable || 'NO',
            consumptionType: type.defaultConsumptionType || 'AUTO_CONSUME',
            batchRequired: type.defaultBatchRequired || false,
            expiryRequired: type.defaultExpiryRequired || false,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            packSize: formData.packSize !== '' ? Number(formData.packSize) : null,
            purchasePrice: formData.purchasePrice !== '' ? Number(formData.purchasePrice) : null,
            sellingPrice: formData.sellingPrice !== '' ? Number(formData.sellingPrice) : null,
            itemTypeId: formData.itemTypeId || null,
            categoryId: formData.categoryId || null,
        };
        try {
            if (editingItem) {
                await updateItem(editingItem.id, payload);
            } else {
                await createItem({ ...payload, isActive: true });
            }
            closeModal();
            fetchData();
        } catch {
            alert(editingItem ? 'Failed to update product' : 'Failed to create product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await deleteItem(id);
            fetchData();
        } catch {
            alert('Failed to delete product');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            code: item.code || '',
            description: item.description || '',
            categoryId: item.categoryId || '',
            unit: item.unit || 'Piece',
            packSize: item.packSize ?? '',
            reorderLevel: item.reorderLevel ?? 5,
            gstPercent: item.gstPercent ?? 0,
            itemTypeId: item.itemTypeId || '',
            purchasePrice: item.purchasePrice ?? '',
            sellingPrice: item.sellingPrice ?? '',
            billable: item.billable || 'NO',
            billingGroup: item.billingGroup || 'PHARMACY',
            consumptionType: item.consumptionType || 'AUTO_CONSUME',
            batchRequired: item.batchRequired || false,
            expiryRequired: item.expiryRequired || false,
            serialRequired: item.serialRequired || false,
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData(EMPTY_FORM);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const selectedType = itemTypes.find(t => t.id === formData.itemTypeId);

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title"><Package size={26} /> Product Master</h1>
                    <p className="page-subtitle">Manage inventory products and their billing, tracking, and consumption behavior.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} /> Add Product
                </button>
            </div>

            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="filter-select">
                        <option value="all">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Products ({filteredItems.length})</h3>
                </div>
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : filteredItems.length === 0 ? (
                        <div className="table-empty">No products found.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Product Name</th>
                                    <th>Item Type</th>
                                    <th>Category</th>
                                    <th>Unit</th>
                                    <th>Billable</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td><span className="mono-sm">{item.code || '-'}</span></td>
                                        <td><strong>{item.name}</strong></td>
                                        <td>
                                            {item.itemTypeName
                                                ? <span className="badge badge-secondary">{item.itemTypeName}</span>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {categories.find(c => c.id === item.categoryId)?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{item.unit || '—'}</td>
                                        <td>
                                            {item.billable === 'YES' && <span className="badge badge-success">Yes</span>}
                                            {item.billable === 'NO' && <span className="badge badge-secondary">No</span>}
                                            {item.billable === 'CONDITIONAL' && <span className="badge badge-warning">Conditional</span>}
                                            {!item.billable && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(item)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
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
                    <span className="table-info">Showing {filteredItems.length} of {items.length} products</span>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '680px', width: '100%' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                {/* BOX 1: Basic Info */}
                                <div style={{ border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--surface-secondary, #f8fafc)', padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.02em', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
                                        Basic Info
                                    </div>
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label required">Item Name</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleNameChange} className="form-input" placeholder="Enter product name" required />
                                        </div>
                                        <div className="form-row" style={{ margin: 0 }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Item Code</label>
                                                <input type="text" name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder="Auto-generated" readOnly={!editingItem} />
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label required">Category</label>
                                                <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="form-select" required>
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Description</label>
                                            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="form-input" placeholder="Optional description" />
                                        </div>
                                        <div className="form-row" style={{ margin: 0 }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">GST %</label>
                                                <select name="gstPercent" value={formData.gstPercent} onChange={handleInputChange} className="form-select">
                                                    {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Min Stock (Reorder Level)</label>
                                                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleInputChange} className="form-input" min="0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BOX 2: Inventory Configuration */}
                                <div style={{ border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--surface-secondary, #f8fafc)', padding: '0.625rem 1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.02em', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
                                        Inventory Configuration
                                    </div>
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                        {/* Item Type */}
                                        <div>
                                            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Item Type</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {itemTypes.map(type => (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => handleItemTypeSelect(type)}
                                                        style={{
                                                            padding: '0.375rem 0.875rem',
                                                            borderRadius: '6px',
                                                            border: formData.itemTypeId === type.id ? '2px solid var(--primary, #3b82f6)' : '1px solid var(--border-color, #e2e8f0)',
                                                            background: formData.itemTypeId === type.id ? 'var(--primary-light, #eff6ff)' : 'var(--surface, #fff)',
                                                            color: formData.itemTypeId === type.id ? 'var(--primary, #3b82f6)' : 'var(--text-primary, #1e293b)',
                                                            fontWeight: formData.itemTypeId === type.id ? 600 : 400,
                                                            fontSize: '0.875rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        {type.name}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedType && (
                                                <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                                                    Defaults applied — adjust below if needed.
                                                </p>
                                            )}
                                        </div>

                                        {/* Unit & Packaging */}
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>Unit &amp; Packaging</div>
                                            <div className="form-row" style={{ margin: 0 }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Base Unit</label>
                                                    <select name="unit" value={formData.unit} onChange={handleInputChange} className="form-select">
                                                        <option value="Piece">Piece (pcs)</option>
                                                        <option value="Box">Box</option>
                                                        <option value="Roll">Roll</option>
                                                        <option value="Kg">Kg</option>
                                                        <option value="Litre">Litre (ml)</option>
                                                        <option value="Pack">Pack</option>
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Pack Size <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(units per pack)</span></label>
                                                    <input type="number" name="packSize" value={formData.packSize} onChange={handleInputChange} className="form-input" placeholder="e.g. 100" min="1" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Billing */}
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>Billing</div>
                                            <div className="form-row" style={{ margin: 0, alignItems: 'flex-start' }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Billable</label>
                                                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.25rem' }}>
                                                        {['YES', 'NO', 'CONDITIONAL'].map(v => (
                                                            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                                <input type="radio" name="billable" value={v} checked={formData.billable === v} onChange={handleInputChange} />
                                                                {BILLABLE_LABEL[v]}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                {(formData.billable === 'YES' || formData.billable === 'CONDITIONAL') && (
                                                    <div className="form-group" style={{ margin: 0 }}>
                                                        <label className="form-label">Billing Group</label>
                                                        <select name="billingGroup" value={formData.billingGroup} onChange={handleInputChange} className="form-select">
                                                            <option value="OT">OT</option>
                                                            <option value="PHARMACY">Pharmacy</option>
                                                            <option value="ROOM">Room</option>
                                                            <option value="PACKAGE">Package</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Behavior */}
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>Behavior</div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Consumption Type</label>
                                                <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.25rem' }}>
                                                    {[['AUTO_CONSUME', 'Auto-consume'], ['RETURNABLE', 'Returnable'], ['ASSIGN_ONLY', 'Assign-only (Asset)']].map(([v, label]) => (
                                                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                            <input type="radio" name="consumptionType" value={v} checked={formData.consumptionType === v} onChange={handleInputChange} />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost */}
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>Cost</div>
                                            <div className="form-row" style={{ margin: 0 }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Purchase Price</label>
                                                    <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className="form-input" placeholder="0.00" min="0" step="0.01" />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label">Selling Price</label>
                                                    <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} className="form-input" placeholder="0.00" min="0" step="0.01" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tracking */}
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>Tracking</div>
                                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                {[['batchRequired', 'Batch Required'], ['expiryRequired', 'Expiry Required'], ['serialRequired', 'Serial Required']].map(([field, label]) => (
                                                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                                        <input type="checkbox" name={field} checked={formData[field]} onChange={handleCheckboxChange} />
                                                        {label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!formData.name.trim() || !formData.categoryId}>
                                    {editingItem ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
