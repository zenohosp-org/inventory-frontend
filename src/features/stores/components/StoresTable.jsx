import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';

function getStoreTypeColor(type) {
    if (type === 'PHARMACY') return 'badge-info';
    if (type === 'INVENTORY') return 'badge-primary';
    return 'badge-secondary';
}

export default function StoresTable({
    stores, loading,
    activeDropdown, setActiveDropdown,
    onEdit, onDelete,
}) {
    return (
        <div className="table-container stores-table-wrap">
            <div className="table-header">
                <h3 className="table-title">Stores ({stores.length})</h3>
            </div>
            <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : stores.length === 0 ? (
                    <div className="table-empty">No stores found. Create your first store to get started.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Store Name</th>
                                <th>Type</th>
                                <th>Block</th>
                                <th>Floor</th>
                                <th>Status</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((store) => (
                                <tr key={store.id}>
                                    <td><strong>{store.name}</strong></td>
                                    <td>
                                        <span className={`badge ${getStoreTypeColor(store.type)}`}>
                                            {store.type || '—'}
                                        </span>
                                    </td>
                                    <td className="text-muted">{store.buildingName || '—'}</td>
                                    <td className="text-muted">{store.floorName || '—'}</td>
                                    <td>
                                        <span className={`badge ${store.isActive ? 'badge-success' : 'badge-gray'}`}>
                                            {store.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="col-actions">
                                        <RowActionsMenu
                                            id={store.id}
                                            activeId={activeDropdown}
                                            onToggle={setActiveDropdown}
                                            actions={[
                                                {
                                                    label: 'View Details',
                                                    render: (
                                                        <Link to={`/stores/${store.id}`} className="assets-dropdown-item">
                                                            <span className="row-actions-icon" style={{ color: '#10b981' }}><Eye size={16} /></span>
                                                            View Details
                                                        </Link>
                                                    ),
                                                },
                                                { label: 'Edit', icon: <Edit2 size={16} />, color: '#3b82f6', onClick: () => onEdit(store) },
                                                { divider: true },
                                                { label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: () => onDelete(store.id) },
                                            ]}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="table-footer">
                <span className="table-info">Total: {stores.length} stores</span>
            </div>
        </div>
    );
}
