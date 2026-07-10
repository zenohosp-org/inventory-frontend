import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useContracts } from './hooks/useContracts';
import ContractsTable from './components/ContractsTable';
import ContractDetailPanel from './components/ContractDetailPanel';
import ContractFormModal from './modals/ContractFormModal';
import PageHeader from '../../components/PageHeader';
import './ContractsPage.css';

export default function ContractsPage() {
    const c = useContracts();
    const [selectedContract, setSelectedContract] = useState(null);

    const handleRowClick = (contract) => {
        setSelectedContract(prev => (prev?.id === contract.id ? null : contract));
    };

    return (
        <div className="main-content">
            <PageHeader 
                title={
                    <>
                        <FileText size={26} />
                        AMC / CMC
                    </>
                }
                subtitle="Register and manage AMC / CMC contracts for assets."
                actions={
                    <>
                        <button className="btn btn-primary" onClick={() => c.openCreateModal('AMC')}>
                            <Plus size={18} />
                            Add AMC
                        </button>
                        <button className="btn btn-primary" onClick={() => c.openCreateModal('CMC')}>
                            <Plus size={18} />
                            Add CMC
                        </button>
                    </>
                }
            />

            <div className="so-layout">
                <ContractsTable
                    contracts={c.contracts}
                    loading={c.loading}
                    activeDropdown={c.activeDropdown}
                    setActiveDropdown={c.setActiveDropdown}
                    onEdit={c.openEditModal}
                    onRenew={c.openRenewModal}
                    onCancel={c.handleCancel}
                    selectedId={selectedContract?.id || null}
                    onRowClick={handleRowClick}
                />

                {selectedContract && (
                    <ContractDetailPanel
                        contract={selectedContract}
                        onClose={() => setSelectedContract(null)}
                    />
                )}
            </div>

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
