import { Users, Plus } from 'lucide-react';
import { useVendors } from './hooks/useVendors';
import VendorsTable from './components/VendorsTable';
import VendorFormModal from './modals/VendorFormModal';
import './VendorsPage.css';

export default function VendorsPage() {
    const v = useVendors();

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <Users size={26} />
                        Vendors Master
                    </h1>
                    <p className="page-subtitle">
                        Manage suppliers and vendor information for purchase orders.
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={v.openCreateModal}>
                        <Plus size={18} />
                        Add Vendor
                    </button>
                </div>
            </div>

            <VendorsTable
                vendors={v.vendors}
                loading={v.loading}
                activeDropdown={v.activeDropdown}
                setActiveDropdown={v.setActiveDropdown}
                onEdit={v.openEditModal}
                onDelete={v.handleDelete}
            />

            {v.showModal && (
                <VendorFormModal
                    editingId={v.editingId}
                    formData={v.formData}
                    stateAutoFilled={v.stateAutoFilled}
                    setField={v.setField}
                    handleGstChange={v.handleGstChange}
                    setActive={v.setActive}
                    onSubmit={v.handleSave}
                    onClose={v.closeModal}
                />
            )}
        </div>
    );
}
