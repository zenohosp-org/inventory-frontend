import { Edit2, RefreshCw, Ban } from 'lucide-react';
import RowActionsMenu from '../../../components/RowActionsMenu';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const fmtMoney = (n) => (n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-');

const statusBadge = (status) => {
    if (status === 'ACTIVE') return 'badge-success';
    if (status === 'EXPIRED') return 'badge-warning';
    return 'badge-secondary'; // CANCELLED / unknown
};

export default function ContractsTable({
    contracts, loading,
    activeDropdown, setActiveDropdown,
    onEdit, onRenew, onCancel,
}) {
    return (
        <div className="table-container contracts-table-wrap">
            <div className="table-header">
                <h3 className="table-title">Contracts ({contracts.length})</h3>
            </div>
            <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : contracts.length === 0 ? (
                    <div className="table-empty">No contracts found. Register your first AMC/CMC contract to get started.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Contract #</th>
                                <th>Type</th>
                                <th>Vendor</th>
                                <th>Value</th>
                                <th>Period</th>
                                <th>Next Service</th>
                                <th>Status</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((c) => (
                                <tr key={c.id}>
                                    <td><strong>{c.asset?.assetName || '-'}</strong></td>
                                    <td className="text-muted mono">{c.contractNumber || '-'}</td>
                                    <td>
                                        <span className="badge badge-secondary">{c.contractType}</span>
                                    </td>
                                    <td className="text-muted">{c.vendor?.name || '-'}</td>
                                    <td className="text-muted">{fmtMoney(c.contractValue)}</td>
                                    <td className="text-muted">
                                        <div>{fmtDate(c.startDate)}</div>
                                        <span className="subtext">to {fmtDate(c.endDate)}</span>
                                    </td>
                                    <td className="text-muted">{fmtDate(c.nextServiceDate)}</td>
                                    <td>
                                        <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                                    </td>
                                    <td className="col-actions">
                                        <RowActionsMenu
                                            id={c.id}
                                            activeId={activeDropdown}
                                            onToggle={setActiveDropdown}
                                            actions={[
                                                { label: 'Edit', icon: <Edit2 size={16} />, color: '#3b82f6', onClick: () => onEdit(c) },
                                                { label: 'Renew', icon: <RefreshCw size={16} />, color: '#16a34a', onClick: () => onRenew(c) },
                                                ...(c.status === 'ACTIVE'
                                                    ? [{ divider: true }, { label: 'Cancel', icon: <Ban size={16} />, danger: true, onClick: () => onCancel(c) }]
                                                    : []),
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
                <span className="table-info">Total: {contracts.length} contracts</span>
            </div>
        </div>
    );
}
