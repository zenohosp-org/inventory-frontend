import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { getItems, getCategories, getVendors, createItem, updateItem, deleteItem } from '../api/client';


export default function InventoryItems() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [editingItem, setEditingItem] = useState(null);

    // Form
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        categoryId: '',
        unit: 'Piece',
        reorderLevel: 5,
        preferredVendorId: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catsRes, vendsRes] = await Promise.all([
                getItems(),
                getCategories(),
                getVendors()
            ]);
            let itemsData = itemsRes.data || itemsRes;
            let catsData = catsRes.data || catsRes;
            let vendsData = vendsRes.data || vendsRes;
            if (typeof itemsData === 'string') itemsData = JSON.parse(itemsData);
            if (typeof catsData === 'string') catsData = JSON.parse(catsData);
            if (typeof vendsData === 'string') vendsData = JSON.parse(vendsData);
            itemsData = Array.isArray(itemsData) ? itemsData : [];
            catsData = Array.isArray(catsData) ? catsData : [];
            vendsData = Array.isArray(vendsData) ? vendsData : [];
            setItems(itemsData);
            setCategories(catsData);
            setVendors(vendsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setItems([]);
            setCategories([]);
            setVendors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createItem({
                ...formData,
                isActive: true
            });

            setFormData({
                name: '',
                code: '',
                categoryId: '',
                unit: 'Piece',
                reorderLevel: 5,
                preferredVendorId: '',
            });
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to create product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteItem(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete product');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            code: item.code,
            categoryId: item.categoryId,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            preferredVendorId: item.preferredVendorId || '',
        });
        setShowModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateItem(editingItem.id, formData);
            setFormData({
                name: '',
                code: '',
                categoryId: '',
                unit: 'Piece',
                reorderLevel: 5,
                preferredVendorId: '',
            });
            setEditingItem(null);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update product');
        }
    };

    const handleSubmit = (e) => {
        editingItem ? handleUpdate(e) : handleCreate(e);
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            code: '',
            categoryId: '',
            unit: 'Piece',
            reorderLevel: 5,
            preferredVendorId: '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            name: '',
            code: '',
            categoryId: '',
            unit: 'Piece',
            reorderLevel: 5,
            preferredVendorId: '',
        });
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <Package size={26} />
                        Product Master
                    </h1>
                    <p className="page-subtitle">
                        Manage pharmaceutical products, categories, and inventory settings.
                    </p>
                </div>

                <button className="btn btn-primary" onClick={() => openCreateModal()}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

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
            </div>

            {/* Products Table */}
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
                                    <th>Min Stock Level</th>
                                    <th>Vendor</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="mono-sm">{item.code || '-'}</span>
                                        </td>
                                        <td>
                                            <strong>{item.name}</strong>
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {categories.find(c => c.id === item.categoryId)?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{item.unit}</td>
                                        <td>
                                            <strong>{item.reorderLevel}</strong>
                                        </td>
                                        <td>
                                            {vendors.find(v => v.id === item.preferredVendorId)?.name || '-'}
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
                    <span className="table-info">
                        Showing {filteredItems.length} of {items.length} products
                    </span>
                    <div className="pagination">
                        <button className="pagination-item" disabled>← Previous</button>
                        <button className="pagination-item active">1</button>
                        <button className="pagination-item">2</button>
                        <button className="pagination-item">→ Next</button>
                    </div>
                </div>
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal modal-md">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
                            <button className="modal-close" onClick={() => closeModal()}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
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
                                            placeholder="e.g., PROD-001"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label required">Unit of Measure</label>
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                            className="form-select"
                                        >
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
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleInputChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
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

                                <div className="form-group">
                                    <label className="form-label">Preferred Vendor</label>
                                    <select
                                        name="preferredVendorId"
                                        value={formData.preferredVendorId}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="">Select Vendor (Optional)</option>
                                        {vendors.map(vendor => (
                                            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => closeModal()}>
                                    Cancel
                                </button>
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
