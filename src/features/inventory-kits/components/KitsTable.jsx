import { MoreVertical, Package, Edit2, Trash2 } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '../utils/kitHelpers';

export default function KitsTable({
    kits, filteredKits, loading,
    selectedKit, setSelectedKit,
    activeDropdown, setActiveDropdown,
    onConsume, onEdit, onDelete,
}) {
    const panelOpen = !!selectedKit;

    return (
        <div className="table-container so-table-wrap kits-table-wrap">
            <div className="table-header">
                <h3 className="table-title">Kits ({filteredKits.length})</h3>
                <span className="text-muted so-hint">Click a row to see components</span>
            </div>
            <div className="table-body">
                {loading ? (
                    <div className="table-empty"><div className="spinner"></div></div>
                ) : filteredKits.length === 0 ? (
                    <div className="table-empty">
                        <p>No kits yet. Click "Create Kit" to add one.</p>
                    </div>
                ) : (
                    <table className="table kits-table">
                        <thead>
                            <tr>
                                {!panelOpen && <th className="col-code">Code</th>}
                                <th>Kit Name</th>
                                {!panelOpen && <th className="col-num">Components</th>}
                                <th className="col-num">Available</th>
                                {!panelOpen && <th className="col-status">Status</th>}
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredKits.map((kit) => {
                                const statusColor = getStatusColor(kit.maxAssemblable);
                                const isSelected = selectedKit?.id === kit.id;
                                return (
                                    <tr
                                        key={kit.id}
                                        onClick={() => setSelectedKit(isSelected ? null : kit)}
                                        className={`so-row${isSelected ? ' so-row-selected' : ''}`}
                                    >
                                        {!panelOpen && <td><span className="mono-sm">{kit.code || '-'}</span></td>}
                                        <td>
                                            <strong>{kit.name}</strong>
                                            {panelOpen && kit.code && <div className="kits-row-sub mono-sm">{kit.code}</div>}
                                        </td>
                                        {!panelOpen && <td className="col-num">{kit.components?.length || 0} items</td>}
                                        <td className="col-num"><strong style={{ color: statusColor }}>{kit.maxAssemblable || 0}</strong></td>
                                        {!panelOpen && (
                                            <td>
                                                <span className="badge" style={{ background: statusColor + '20', color: statusColor }}>
                                                    {getStatusLabel(kit.maxAssemblable)}
                                                </span>
                                            </td>
                                        )}
                                        <td onClick={e => e.stopPropagation()} className="col-actions">
                                            <div className="kits-actions-cell">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === kit.id ? null : kit.id); }}
                                                    className="app-btn-icon"
                                                    aria-label="Row actions"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {activeDropdown === kit.id && (
                                                    <div className="assets-dropdown kits-actions-dropdown">
                                                        <button onClick={(e) => { e.stopPropagation(); onConsume(kit); }} className="assets-dropdown-item">
                                                            <Package size={16} style={{ color: '#8b5cf6' }} /> Consume
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); onEdit(kit); }} className="assets-dropdown-item">
                                                            <Edit2 size={16} style={{ color: '#3b82f6' }} /> Edit
                                                        </button>
                                                        <div style={{ height: '1px', margin: '4px 0', background: '#f1f5f9' }} />
                                                        <button onClick={(e) => { e.stopPropagation(); onDelete(kit); }} className="assets-dropdown-item--danger">
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="table-footer">
                <span className="table-info">Showing {filteredKits.length} of {kits.length} kits</span>
            </div>
        </div>
    );
}
