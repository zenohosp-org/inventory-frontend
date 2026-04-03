import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await getCategories();
            setCategories(res.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
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
                <h1 className="flex page-title" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <Layers size={28} style={{ color: 'var(--color-accent)' }} />
                    Product Categories
                </h1>
                <p className="page-subtitle">
                    Organize inventory items by product categories and groups.
                </p>
            </div>

            {/* Page Actions */}
            <div className="page-actions">
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* Categories Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Categories ({categories.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No categories found. Create your first category to get started.
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Category Name</th>
                                    <th style={{ width: '40%' }}>Description</th>
                                    <th style={{ width: '15%' }}>Status</th>
                                    <th style={{ width: '15%' }}>Actions</th>
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
                                        <td>
                                            <div style={{
                                                display: 'flex',
                                                gap: 'var(--spacing-2)'
                                            }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleOpenModal(cat)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(cat.id)}
                                                    title="Delete"
                                                >
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
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-2)',
                                        cursor: 'pointer',
                                        fontWeight: 'var(--fw-medium)',
                                        color: 'var(--color-gray-700)'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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
