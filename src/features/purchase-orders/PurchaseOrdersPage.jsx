import { ShoppingCart, Plus, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePurchaseOrders } from './hooks/usePurchaseOrders';
import { STATUS_MAP } from './utils/poHelpers';
import { stripHospitalPrefix } from '../../utils/format';
import PODetailPanel from './components/PODetailPanel';
import CreatePOModal from './modals/CreatePOModal';
import ReceiveItemsModal from './modals/ReceiveItemsModal';
import PayAdvanceModal from './modals/PayAdvanceModal';
import './PurchaseOrdersPage.css';

export default function PurchaseOrdersPage() {
    const { user } = useAuth();
    const po = usePurchaseOrders(user);

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <ShoppingCart size={26} />
                        Purchase Orders
                    </h1>
                    <p className="page-subtitle">Create and manage purchase orders from suppliers.</p>
                </div>
                <button className="btn btn-primary" onClick={() => po.setShowCreateModal(true)}>
                    <Plus size={18} />
                    Create Purchase Order
                </button>
            </div>

            {po.error && (
                <div className="po-error-banner">
                    <AlertCircle size={18} className="po-error-banner-icon" />
                    <div className="po-error-banner-body">
                        <strong>Error</strong>
                        {po.error}
                    </div>
                    <button className="po-error-retry" onClick={po.fetchData}>Retry</button>
                </div>
            )}

            <div className="so-layout">
                <div className="table-container so-table-wrap">
                    <div className="table-header">
                        <h3 className="table-title">Purchase Orders ({po.filteredPos.length})</h3>
                        <div className="po-search">
                            <Search size={14} className="po-search-icon" />
                            <input
                                type="text"
                                placeholder="Search PO, vendor, store..."
                                value={po.searchQuery}
                                onChange={(e) => po.setSearchQuery(e.target.value)}
                                className="po-search-input"
                            />
                            {po.searchQuery && (
                                <button className="po-search-clear" onClick={() => po.setSearchQuery('')}>×</button>
                            )}
                        </div>
                    </div>
                    <div className="table-body">
                        {po.loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : po.filteredPos.length === 0 ? (
                            <div className="table-empty">{po.searchQuery ? 'No matching purchase orders.' : 'No purchase orders found.'}</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>PO #</th>
                                        <th>Vendor</th>
                                        {!po.selectedPOId && <th>Store</th>}
                                        {!po.selectedPOId && <th>Order Date</th>}
                                        {!po.selectedPOId && <th>Expected</th>}
                                        {!po.selectedPOId && <th>Items</th>}
                                        <th>Total</th>
                                        <th>Status</th>
                                        {!po.selectedPOId && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.paginatedPos.map(row => {
                                        const s = STATUS_MAP[row.status] || { label: row.status || '-', color: 'badge-secondary' };
                                        const bill = po.billsByPoId[row.id];
                                        const canPay = bill?.paymentStatus !== 'PAID';
                                        const isSelected = po.selectedPOId === row.id;
                                        return (
                                            <tr
                                                key={row.id}
                                                className={`so-row${isSelected ? ' so-row-selected' : ''}`}
                                                onClick={() => po.setSelectedPOId(isSelected ? null : row.id)}
                                            >
                                                <td><strong className="mono">{stripHospitalPrefix(row.poNumber) || row.id}</strong></td>
                                                <td>{row.vendor?.name || row.vendorName || '-'}</td>
                                                {!po.selectedPOId && <td className="po-store-col">{row.store?.name || '-'}</td>}
                                                {!po.selectedPOId && <td className="text-muted">{new Date(row.createdAt).toLocaleDateString()}</td>}
                                                {!po.selectedPOId && <td className="text-muted">{row.expectedDate ? new Date(row.expectedDate).toLocaleDateString() : '-'}</td>}
                                                {!po.selectedPOId && <td><span className="po-count-chip">{row.items?.length || 0}</span></td>}
                                                <td>₹{Number(row.totalAmount || 0).toLocaleString()}</td>
                                                <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                                                {!po.selectedPOId && (
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="po-action-group">
                                                            {(row.status === 'ORDERED' || row.status === 'PARTIALLY_RECEIVED') && (
                                                                <button className="btn btn-sm btn-primary" onClick={() => po.openReceiptModal(row)}>
                                                                    Receive
                                                                </button>
                                                            )}
                                                            {canPay && (
                                                                <button className="btn btn-sm btn-accent" onClick={() => po.openPayModal(row)}>
                                                                    Pay Advance
                                                                </button>
                                                            )}
                                                            {row.status === 'BILLED' && (
                                                                <span className="text-muted">Billed</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="table-footer">
                        <span className="table-info">
                            Showing {po.filteredPos.length === 0 ? 0 : po.pageIndex * po.pageSize + 1}–{Math.min((po.pageIndex + 1) * po.pageSize, po.filteredPos.length)} of {po.filteredPos.length} purchase orders
                        </span>
                        {po.totalPages > 1 && (
                            <div className="pagination">
                                <button className="pagination-item" disabled={po.pageIndex === 0} onClick={() => po.setPageIndex(po.pageIndex - 1)}>← Previous</button>
                                {(() => {
                                    const visible = Math.min(po.totalPages, 5);
                                    const start = Math.max(0, Math.min(po.pageIndex - 2, po.totalPages - visible));
                                    return Array.from({ length: visible }).map((_, i) => {
                                        const page = start + i;
                                        return (
                                            <button key={page} className={`pagination-item ${po.pageIndex === page ? 'active' : ''}`} onClick={() => po.setPageIndex(page)}>
                                                {page + 1}
                                            </button>
                                        );
                                    });
                                })()}
                                <button className="pagination-item" disabled={po.pageIndex >= po.totalPages - 1} onClick={() => po.setPageIndex(po.pageIndex + 1)}>Next →</button>
                            </div>
                        )}
                    </div>
                </div>

                {po.selectedPO && (
                    <PODetailPanel
                        po={po.selectedPO}
                        bill={po.selectedBill}
                        grns={po.selectedGrns}
                        onClose={() => po.setSelectedPOId(null)}
                        onReceive={() => po.openReceiptModal(po.selectedPO)}
                        onPayAdvance={() => po.openPayModal(po.selectedPO)}
                    />
                )}
            </div>

            {/* Modals — only mounted when open */}
            {po.showCreateModal && (
                <CreatePOModal
                    formData={po.formData}
                    setFormData={po.setFormData}
                    vendors={po.vendors}
                    activeStores={po.activeStores}
                    items={po.items}
                    onSubmit={po.handleCreate}
                    onClose={() => po.setShowCreateModal(false)}
                />
            )}

            {po.receiptModal && (
                <ReceiveItemsModal
                    po={po.receiptModal}
                    activeStores={po.activeStores}
                    receiptQtys={po.receiptQtys}
                    setReceiptQtys={po.setReceiptQtys}
                    submitting={po.submitting}
                    onSubmit={po.handleReceiptSubmit}
                    onClose={() => po.setReceiptModal(null)}
                />
            )}

            {po.payModal && (
                <PayAdvanceModal
                    po={po.payModal}
                    payForm={po.payForm}
                    setPayForm={po.setPayForm}
                    bankAccounts={po.bankAccounts}
                    bankLoading={po.bankLoading}
                    submitting={po.submitting}
                    onSubmit={po.handlePaySubmit}
                    onClose={() => po.setPayModal(null)}
                />
            )}
        </div>
    );
}
