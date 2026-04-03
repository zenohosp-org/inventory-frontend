import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InventoryItems() {
    const { getAuthHeaders } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

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
                axios.get('/api/inventory/items', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/categories', { headers: getAuthHeaders() }),
                axios.get('/api/inventory/vendors', { headers: getAuthHeaders() })
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setVendors(vendsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
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
            await axios.post('/api/inventory/items', {
                ...formData,
                isActive: true
            }, { headers: getAuthHeaders() });

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
            await axios.delete(`/api/inventory/items/${id}`, { headers: getAuthHeaders() });
            fetchData();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete product');
        }
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
                <h1 className="page-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <Package size={28} style={{ color: 'var(--color-accent)' }} />
                    Product Master
                </h1>
                <p className="page-subtitle">
                    Manage pharmaceutical products, categories, and inventory settings.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group" style={{ flex: 1 }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                        <Search size={18} style={{ color: 'var(--color-gray-500)' }} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-input"
                            style={{ backgroundColor: 'transparent', border: 'none', flex: 1 }}
                        />
                    </div>
                </div>

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

                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Products Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Products ({filteredItems.length})</h3>
                    <div className="table-actions">
                        <button className="btn btn-sm btn-secondary">Download</button>
                        <button className="btn btn-sm btn-secondary">Print</button>
                    </div>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No products found.
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '10%' }}>Code</th>
                                    <th style={{ width: '25%' }}>Product Name</th>
                                    <th style={{ width: '15%' }}>Category</th>
                                    <th style={{ width: '10%' }}>UoM</th>
                                    <th style={{ width: '12%' }}>Min Stock Level</th>
                                    <th style={{ width: '15%' }}>Vendor</th>
                                    <th style={{ width: '13%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--color-gray-600)' }}>
                                                {item.code || '-'}
                                            </span>
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
                                            <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                                                <button className="btn btn-sm btn-ghost">
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
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Product</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreate}>
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!formData.name.trim() || !formData.categoryId}>
                                    Add Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
