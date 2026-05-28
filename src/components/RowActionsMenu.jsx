import { MoreVertical } from 'lucide-react';

/**
 * Compact "three-dot" row action menu used in tables across the app.
 *
 * Usage:
 *   <RowActionsMenu
 *       id={item.id}
 *       activeId={activeDropdown}
 *       onToggle={setActiveDropdown}
 *       align="right"
 *       actions={[
 *           { label: 'Edit', icon: <Edit2 size={16} />, color: '#3b82f6', onClick: () => openEdit(item) },
 *           { divider: true },
 *           { label: 'Delete', icon: <Trash2 size={16} />, danger: true, onClick: () => onDelete(item.id) },
 *       ]}
 *   />
 *
 * Each action item is either:
 *   - { divider: true }
 *   - { label, icon?, color?, danger?, onClick, render? }
 *     `render` lets the caller supply a custom element (e.g. a <Link>) — when present, the
 *     other fields are ignored and the menu just wraps it for hover/spacing.
 */
export default function RowActionsMenu({ id, activeId, onToggle, actions, align = 'right' }) {
    const isOpen = activeId === id;

    return (
        <div className="row-actions-menu">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(isOpen ? null : id); }}
                className="app-btn-icon"
                aria-label="Row actions"
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div className={`assets-dropdown row-actions-dropdown is-${align}`}>
                    {actions.map((action, idx) => {
                        if (action.divider) {
                            return <div key={`d-${idx}`} className="row-actions-divider" />;
                        }
                        if (action.render) {
                            return (
                                <span key={action.label || idx} onClick={() => onToggle(null)}>
                                    {action.render}
                                </span>
                            );
                        }
                        return (
                            <button
                                key={action.label}
                                onClick={(e) => { e.stopPropagation(); onToggle(null); action.onClick?.(); }}
                                className={action.danger ? 'assets-dropdown-item--danger' : 'assets-dropdown-item'}
                            >
                                {action.icon && (
                                    <span className="row-actions-icon" style={action.color ? { color: action.color } : undefined}>
                                        {action.icon}
                                    </span>
                                )}
                                {action.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
