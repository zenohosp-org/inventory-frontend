import { Plus, Package } from 'lucide-react';
import { useInventoryKits } from './hooks/useInventoryKits';
import KitsTable from './components/KitsTable';
import KitDetailPanel from './components/KitDetailPanel';
import KitFormModal from './modals/KitFormModal';
import ConsumeKitModal from './modals/ConsumeKitModal';
import './InventoryKitsPage.css';

export default function InventoryKitsPage() {
    const k = useInventoryKits();

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title"><Package size={26} /> Inventory Kits</h1>
                    <p className="page-subtitle">Create and manage item kits.</p>
                </div>
                <button className="btn btn-primary" onClick={k.openCreateModal}>
                    <Plus size={18} />
                    Create Kit
                </button>
            </div>

            {k.error && <div className="alert alert-error">{k.error}</div>}

            <div className="filter-bar">
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by kit name or code..."
                            value={k.searchQuery}
                            onChange={(e) => k.setSearchQuery(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
            </div>

            <div className="so-layout">
                <KitsTable
                    kits={k.kits}
                    filteredKits={k.filteredKits}
                    loading={k.loading}
                    selectedKit={k.selectedKit}
                    setSelectedKit={k.setSelectedKit}
                    activeDropdown={k.activeDropdown}
                    setActiveDropdown={k.setActiveDropdown}
                    onConsume={k.openConsumeModal}
                    onEdit={k.openEditModal}
                    onDelete={k.handleDelete}
                />

                {k.selectedKit && !k.showConsumeModal && (
                    <KitDetailPanel kit={k.selectedKit} onClose={() => k.setSelectedKit(null)} />
                )}
            </div>

            {k.showModal && (
                <KitFormModal
                    editingKit={k.editingKit}
                    formData={k.formData}
                    setFormData={k.setFormData}
                    items={k.items}
                    submitting={k.submitting}
                    onSubmit={k.handleSubmit}
                    onClose={k.closeFormModal}
                />
            )}

            {k.showConsumeModal && k.selectedKit && (
                <ConsumeKitModal
                    kit={k.selectedKit}
                    stores={k.stores}
                    consumeForm={k.consumeForm}
                    setConsumeForm={k.setConsumeForm}
                    lowStockWarning={k.lowStockWarning}
                    submitting={k.submitting}
                    onSubmit={k.handleConsumeSubmit}
                    onClose={() => k.setShowConsumeModal(false)}
                />
            )}
        </div>
    );
}
