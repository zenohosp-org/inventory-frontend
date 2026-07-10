import { Edit2, Trash2 } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';

export default function VendorsTable({
    vendors, loading,
    activeDropdown, setActiveDropdown,
    onEdit, onDelete,
}) {
    return (
        <div className="zu-table-wrapper vendors-table-wrap">
            <div className="table-header">
                <h3 className="table-title">Vendors ({vendors.length})</h3>
            </div>
            <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : vendors.length === 0 ? (
                    <div className="table-empty">No vendors found. Add your first vendor to get started.</div>
                ) : (
                    <table className="zu-table">
                        <thead>
                            <tr>
                                <th>Vendor Name</th>
                                <th>Contact Person</th>
                                <th>Phone / Email</th>
                                <th>GST Type</th>
                                <th>GST / PAN</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((v) => (
                                <tr key={v.id}>
                                    <td><strong>{v.name}</strong></td>
                                    <td className="text-muted">{v.contactName || '-'}</td>
                                    <td className="text-muted">
                                        <div>{v.phone || '-'}</div>
                                        <span className="subtext">{v.email || '-'}</span>
                                    </td>
                                    <td className="text-muted">
                                        {v.gstRegistrationType
                                            ? <span className="badge badge-secondary">{v.gstRegistrationType}</span>
                                            : '-'}
                                    </td>
                                    <td className="text-muted mono">
                                        <div>{v.gstNumber || '-'}</div>
                                        <span className="subtext">{v.panNumber || '-'}</span>
                                    </td>
                                    <td className="text-muted">
                                        {[v.city, v.state, v.pincode].filter(Boolean).join(', ') || '-'}
                                    </td>
                                    <td>
                                        <span className={`badge ${v.isActive !== false ? 'badge-success' : 'badge-warning'}`}>
                                            {v.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="col-actions">
                                        <RowActionsMenu
                                            id={v.id}
                                            activeId={activeDropdown}
                                            onToggle={setActiveDropdown}
                                            actions={[
                                                { label: 'Edit', icon: <Edit2 size={16} />, color: '#3b82f6', onClick: () => onEdit(v) },
                                                { divider: true },
                                                { label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: () => onDelete(v.id) },
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
                <span className="table-info">Total: {vendors.length} vendors</span>
            </div>
        </div>
    );
}
