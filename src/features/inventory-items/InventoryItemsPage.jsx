import { useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { useInventoryItems } from './hooks/useInventoryItems';
import ItemsTable from './components/ItemsTable';
import ItemDetailPanel from './components/ItemDetailPanel';
import ItemFormModal from './modals/ItemFormModal';
import PageHeader from '../../components/PageHeader';
import './InventoryItemsPage.css';

export default function InventoryItemsPage() {
    const it = useInventoryItems();
    const [selectedItem, setSelectedItem] = useState(null);

    const handleRowClick = (item) => {
        setSelectedItem(prev => (prev?.id === item.id ? null : item));
    };

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <Package size={26} /> Product Master
                    </>
                }
                subtitle="Manage inventory products and their billing, tracking, and consumption behavior."
                actions={
                    <button className="btn btn-primary" onClick={it.openCreateModal}>
                        <Plus size={18} /> Add Product
                    </button>
                }
            />
            <div className="zu-page-content">


            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={it.searchTerm}
                            onChange={(e) => it.setSearchTerm(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select value={it.selectedCategory} onChange={(e) => it.setSelectedCategory(e.target.value)} className="filter-select">
                        <option value="all">All Categories</option>
                        {it.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="so-layout">
                <ItemsTable
                    loading={it.loading}
                    filteredItems={it.filteredItems}
                    paginatedItems={it.paginatedItems}
                    categories={it.categories}
                    pageIndex={it.pageIndex}
                    pageSize={it.pageSize}
                    totalPages={it.totalPages}
                    setPageIndex={it.setPageIndex}
                    activeDropdown={it.activeDropdown}
                    setActiveDropdown={it.setActiveDropdown}
                    onEdit={it.openEditModal}
                    onDelete={it.handleDelete}
                    selectedItemId={selectedItem?.id || null}
                    onRowClick={handleRowClick}
                />

                {selectedItem && (
                    <ItemDetailPanel
                        item={selectedItem}
                        categories={it.categories}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </div>

            {it.showModal && (
                <ItemFormModal
                    editingItem={it.editingItem}
                    formData={it.formData}
                    setFormData={it.setFormData}
                    categories={it.categories}
                    itemTypes={it.itemTypes}
                    onSubmit={it.handleSubmit}
                    onClose={it.closeModal}
                    handleNameChange={it.handleNameChange}
                    handleInputChange={it.handleInputChange}
                    handleCheckboxChange={it.handleCheckboxChange}
                    handleItemTypeSelect={it.handleItemTypeSelect}
                />
            )}
                    </div>
        </div>
    );
}
