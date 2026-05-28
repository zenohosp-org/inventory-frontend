import { ShoppingCart, Plus, X, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePurchaseOrders } from './hooks/usePurchaseOrders';
import { STATUS_MAP } from './utils/poHelpers';
import CreatePOModal from './modals/CreatePOModal';
import ReceiveItemsModal from './modals/ReceiveItemsModal';
import PayAdvanceModal from './modals/PayAdvanceModal';
import './PurchaseOrdersPage.css';

export default function PurchaseOrdersPage() {
    const { user } = useAuth();
    const po = usePurchaseOrders(user);

    const selectedStatus = po.selectedPO
        ? (STATUS_MAP[po.selectedPO.status] || { label: po.selectedPO.status || '-', color: 'badge-secondary' })
        : null;

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
                                                <td><strong className="mono">{row.poNumber || row.id}</strong></td>
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
                    <div className="so-panel">
                        <div className="so-panel-header">
                            <div>
                                <div className="so-panel-name">{po.selectedPO.poNumber || po.selectedPO.id}</div>
                                <div className="so-panel-meta">
                                    {po.selectedPO.vendor?.name || po.selectedPO.vendorName || '-'}
                                    {po.selectedPO.store?.name ? ` · ${po.selectedPO.store.name}` : ''}
                                </div>
                                <div className="so-panel-stats">
                                    <div>
                                        <div className="so-stat-label">Status</div>
                                        <div className="so-stat-value" style={{ fontSize: 13 }}>
                                            <span className={`badge ${selectedStatus.color}`}>{selectedStatus.label}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="so-stat-label">Total</div>
                                        <div className="so-stat-value">₹{Number(po.selectedPO.totalAmount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="so-stat-label">GRNs</div>
                                        <div className="so-stat-value so-stat-value--incoming">{po.selectedGrns.length}</div>
                                    </div>
                                </div>
                            </div>
                            <button className="so-panel-close" onClick={() => po.setSelectedPOId(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="po-detail-body">
                            <div className="po-detail-section">
                                <div className="po-detail-section-title">Ordered Items</div>
                                <table className="table po-detail-items">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ textAlign: 'center' }}>Ord</th>
                                            <th style={{ textAlign: 'center' }}>Rcvd</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(po.selectedPO.items || []).map(it => {
                                            const recv = Number(it.receivedQty || 0);
                                            const ord = Number(it.quantity || 0);
                                            const amt = Number(it.unitPrice || 0) * ord;
                                            return (
                                                <tr key={it.id}>
                                                    <td>{it.inventoryItem?.name || '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>{ord}</td>
                                                    <td style={{ textAlign: 'center', color: recv >= ord ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{recv}</td>
                                                    <td style={{ textAlign: 'right' }}>₹{amt.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="po-detail-section">
                                <div className="po-detail-section-title">Actions</div>
                                <div className="po-detail-actions">
                                    {(po.selectedPO.status === 'ORDERED' || po.selectedPO.status === 'PARTIALLY_RECEIVED') && (
                                        <button className="btn btn-sm btn-primary" onClick={() => po.openReceiptModal(po.selectedPO)}>Receive Items</button>
                                    )}
                                    {po.selectedBill?.paymentStatus !== 'PAID' && (
                                        <button className="btn btn-sm btn-accent" onClick={() => po.openPayModal(po.selectedPO)}>Pay Advance</button>
                                    )}
                                    {po.selectedPO.status === 'BILLED' && <span className="text-muted">Already Billed</span>}
                                </div>
                            </div>

                            {po.selectedBill && (
                                <div className="po-detail-section po-detail-section--bill">
                                    <div className="po-detail-section-title">Linked Bill</div>
                                    <div className="po-detail-card-row">
                                        <div>
                                            <div className="po-detail-card-title">{po.selectedBill.billNumber || po.selectedBill.id}</div>
                                            <div className="po-detail-card-sub">
                                                Paid ₹{Number(po.selectedBill.paidAmount || 0).toLocaleString()} of ₹{Number(po.selectedBill.totalAmount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={`badge ${po.selectedBill.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                            {po.selectedBill.paymentStatus || '-'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="po-detail-section po-detail-section--grn">
                                <div className="po-detail-section-title">Goods Received Notes ({po.selectedGrns.length})</div>
                                {po.selectedGrns.length === 0 ? (
                                    <div className="text-muted po-detail-empty">No receipts yet.</div>
                                ) : (
                                    <div className="po-detail-grn-list">
                                        {po.selectedGrns.map(g => (
                                            <div key={g.id} className="po-detail-card-row">
                                                <div>
                                                    <div className="po-detail-card-title">{g.grnNumber}</div>
                                                    <div className="po-detail-card-sub">
                                                        {g.receivedAt ? new Date(g.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                                        {` · ${g.items?.length || 0} line${g.items?.length === 1 ? '' : 's'}`}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
