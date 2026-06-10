import { FileText, Plus } from 'lucide-react';
import { useContracts } from './hooks/useContracts';
import ContractsTable from './components/ContractsTable';
import ContractFormModal from './modals/ContractFormModal';
import './ContractsPage.css';

export default function ContractsPage() {
    const c = useContracts();

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <FileText size={26} />
                        AMC / CMC
                    </h1>
                    <p className="page-subtitle">
                        Register and manage AMC / CMC contracts for assets.
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => c.openCreateModal('AMC')}>
                        <Plus size={18} />
                        Add AMC
                    </button>
                    <button className="btn btn-primary" onClick={() => c.openCreateModal('CMC')}>
                        <Plus size={18} />
                        Add CMC
                    </button>
                </div>
            </div>

            <ContractsTable
                contracts={c.contracts}
                loading={c.loading}
                activeDropdown={c.activeDropdown}
                setActiveDropdown={c.setActiveDropdown}
                onEdit={c.openEditModal}
                onRenew={c.openRenewModal}
                onCancel={c.handleCancel}
            />

            {c.showModal && (
                <ContractFormModal
                    mode={c.mode}
                    formData={c.formData}
                    assets={c.assets}
                    vendors={c.vendors}
                    saving={c.saving}
                    setField={c.setField}
                    setSelect={c.setSelect}
                    onSubmit={c.handleSave}
                    onClose={c.closeModal}
                />
            )}
        </div>
    );
}
