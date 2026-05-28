import { Store, Plus } from 'lucide-react';
import { useStores } from './hooks/useStores';
import StoresTable from './components/StoresTable';
import StoreFormModal from './modals/StoreFormModal';
import './StoresPage.css';

export default function StoresPage() {
    const s = useStores();

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <Store size={26} />
                        Stores Master
                    </h1>
                    <p className="page-subtitle">
                        Create and manage hospital stores and storage locations.
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={s.openCreateModal}>
                        <Plus size={18} />
                        Add Store
                    </button>
                </div>
            </div>

            <StoresTable
                stores={s.stores}
                loading={s.loading}
                activeDropdown={s.activeDropdown}
                setActiveDropdown={s.setActiveDropdown}
                onEdit={s.openEditModal}
                onDelete={s.handleDelete}
            />

            {s.showModal && (
                <StoreFormModal
                    editingStore={s.editingStore}
                    formData={s.formData}
                    buildings={s.buildings}
                    selectedBuilding={s.selectedBuilding}
                    selectedFloor={s.selectedFloor}
                    floors={s.floors}
                    hmsLoading={s.hmsLoading}
                    hmsError={s.hmsError}
                    setField={s.setField}
                    selectBuilding={s.selectBuilding}
                    selectFloor={s.selectFloor}
                    onSubmit={s.handleSave}
                    onClose={s.closeModal}
                />
            )}
        </div>
    );
}
