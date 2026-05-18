import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X, MoreVertical } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/client';


export default function InventoryCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        isActive: true
    });
    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await getCategories();
            let catsData = res.data || res;
            if (typeof catsData === 'string') catsData = JSON.parse(catsData);
            catsData = Array.isArray(catsData) ? catsData : [];
            setCategories(catsData);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingId(category.id);
            setFormData({
                name: category.name,
                isActive: category.isActive !== false
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCategory(editingId, formData);
            } else {
                await createCategory(formData);
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategory(id);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Failed to delete category');
            }
        }
    };

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <Layers size={26} />
                        Product Categories
                    </h1>
                    <p className="page-subtitle">
                        Organize inventory items by product categories and groups.
                    </p>
                </div>

                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Categories Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Categories ({categories.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : categories.length === 0 ? (
                        <div className="table-empty">No categories found. Create your first category to get started.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td>
                                            <strong>{cat.name}</strong>
                                        </td>
                                        <td className="text-muted">
                                            {cat.description || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${cat.isActive !== false ? 'badge-success' : 'badge-warning'}`}>
                                                {cat.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === cat.id ? null : cat.id); }}
                                                className="app-btn-icon"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {activeDropdown === cat.id && (
                                                <div className="assets-dropdown">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(cat); }} className="assets-dropdown-item">
                                                        <Edit2 size={16} style={{ color: '#3b82f6' }} /> Edit
                                                    </button>
                                                    <div style={{ height: '1px', margin: '4px 0', background: '#f1f5f9' }} />
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} className="assets-dropdown-item--danger">
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
                    <span className="table-info">
                        Total: {categories.length} categories
                    </span>
                </div>
            </div>

            {/* Category Modal */}
            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingId ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Category Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Surgical Instruments"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        Mark as Active
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
