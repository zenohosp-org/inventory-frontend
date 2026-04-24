import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { getItems, getCategories, createItem, updateItem, deleteItem } from '../api/client';

const GST_OPTIONS = [0, 5, 12, 18, 28];

const EMPTY_FORM = {
    name: '',
    code: '',
    categoryId: '',
    unit: 'Piece',
    reorderLevel: 5,
    gstPercent: 0,
};

function generateCode(name, items) {
    const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    if (!prefix) return '';
    const count = items.filter(i => i.code?.startsWith(prefix + '-')).length;
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export default function InventoryItems() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
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
            const [itemsRes, catsRes] = await Promise.all([getItems(), getCategories()]);
            let itemsData = itemsRes.data || itemsRes;
            let catsData = catsRes.data || catsRes;
            if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData);
            if (typeof catsData === 'string') catsData = JSON.parse(catsData);
            setItems(Array.isArray(itemsData) ? itemsData : []);
            setCategories(Array.isArray(catsData) ? catsData : []);
        } catch {
            setItems([]); setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            // auto-generate code only in create mode
            ...(editingItem ? {} : { code: generateCode(name, items) }),
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateItem(editingItem.id, formData);
            } else {
                await createItem({ ...formData, isActive: true });
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
            name: item.name,
            code: item.code || '',
            categoryId: item.categoryId || '',
            unit: item.unit || 'Piece',
            reorderLevel: item.reorderLevel ?? 5,
            gstPercent: item.gstPercent ?? 0,
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

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title"><Package size={26} /> Product Master</h1>
                <p className="page-subtitle">Manage pharmaceutical products, categories, and inventory settings.</p>
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
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} /> Add Product
                </button>
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
                                    <th>Category</th>
                                    <th>UoM</th>
                                    <th>GST %</th>
                                    <th>Min Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td><span className="mono-sm">{item.code || '-'}</span></td>
                                        <td><strong>{item.name}</strong></td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {categories.find(c => c.id === item.categoryId)?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{item.unit}</td>
                                        <td>{item.gstPercent ?? 0}%</td>
                                        <td><strong>{item.reorderLevel}</strong></td>
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
                    <div className="modal modal-md">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="modal-close" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleNameChange}
                                        className="form-input"
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Product Code</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Auto-generated"
                                            readOnly={!editingItem}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label required">Unit of Measure</label>
                                        <select name="unit" value={formData.unit} onChange={handleInputChange} className="form-select">
                                            <option value="Piece">Piece</option>
                                            <option value="Box">Box</option>
                                            <option value="Roll">Roll</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Litre">Litre</option>
                                            <option value="Pack">Pack</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label required">Category</label>
                                        <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="form-select" required>
                                            <option value="">Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">GST %</label>
                                        <select name="gstPercent" value={formData.gstPercent} onChange={handleInputChange} className="form-select">
                                            {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Min Stock Level</label>
                                    <input
                                        type="number"
                                        name="reorderLevel"
                                        value={formData.reorderLevel}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="0"
                                    />
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
