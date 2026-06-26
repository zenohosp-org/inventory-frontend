import { Edit2, Trash2 } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';
import { stripHospitalPrefix } from '../../../utils/format';

const BILLABLE_BADGE = {
    YES: { className: 'badge-success', label: 'Yes' },
    NO: { className: 'badge-secondary', label: 'No' },
    CONDITIONAL: { className: 'badge-warning', label: 'Conditional' },
};

export default function ItemsTable({
    loading,
    filteredItems,
    paginatedItems,
    categories,
    pageIndex,
    pageSize,
    totalPages,
    setPageIndex,
    activeDropdown,
    setActiveDropdown,
    onEdit,
    onDelete,
    selectedItemId,
    onRowClick,
}) {
    const panelOpen = selectedItemId != null;
    return (
        <div className="table-container items-table-wrap so-table-wrap">
            <div className="table-header">
                <h3 className="table-title">Products ({filteredItems.length})</h3>
            </div>
            <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : filteredItems.length === 0 ? (
                    <div className="table-empty">No products found.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Product Name</th>
                                {!panelOpen && <th>Item Type</th>}
                                <th>Category</th>
                                {!panelOpen && <th>Unit</th>}
                                {!panelOpen && <th>Billable</th>}
                                {!panelOpen && <th className="col-actions">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.map(item => {
                                const billable = BILLABLE_BADGE[item.billable];
                                const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'N/A';
                                return (
                                    <tr
                                        key={item.id}
                                        className={`so-row${selectedItemId === item.id ? ' so-row-selected' : ''}`}
                                        onClick={() => onRowClick(item)}
                                    >
                                        <td><span className="mono-sm">{stripHospitalPrefix(item.code) || '-'}</span></td>
                                        <td><strong>{item.name}</strong></td>
                                        {!panelOpen && (
                                            <td>
                                                {item.itemTypeName
                                                    ? <span className="badge badge-secondary">{item.itemTypeName}</span>
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                        )}
                                        <td><span className="badge badge-primary">{categoryName}</span></td>
                                        {!panelOpen && <td>{item.unit || '—'}</td>}
                                        {!panelOpen && (
                                            <td>
                                                {billable
                                                    ? <span className={`badge ${billable.className}`}>{billable.label}</span>
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                        )}
                                        {!panelOpen && (
                                            <td className="col-actions" onClick={e => e.stopPropagation()}>
                                                <RowActionsMenu
                                                    id={item.id}
                                                    activeId={activeDropdown}
                                                    onToggle={setActiveDropdown}
                                                    actions={[
                                                        { label: 'Edit', icon: <Edit2 size={16} />, color: '#3b82f6', onClick: () => onEdit(item) },
                                                        { divider: true },
                                                        { label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: () => onDelete(item.id) },
                                                    ]}
                                                />
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
                    Showing {filteredItems.length === 0 ? 0 : pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredItems.length)} of {filteredItems.length} products
                </span>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button className="pagination-item" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>← Previous</button>
                        {(() => {
                            const visible = Math.min(totalPages, 5);
                            const start = Math.max(0, Math.min(pageIndex - 2, totalPages - visible));
                            return Array.from({ length: visible }).map((_, i) => {
                                const page = start + i;
                                return (
                                    <button key={page} className={`pagination-item ${pageIndex === page ? 'active' : ''}`} onClick={() => setPageIndex(page)}>
                                        {page + 1}
                                    </button>
                                );
                            });
                        })()}
                        <button className="pagination-item" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
