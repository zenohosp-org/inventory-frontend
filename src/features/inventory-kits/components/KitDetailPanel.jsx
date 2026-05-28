import { X } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '../utils/kitHelpers';

export default function KitDetailPanel({ kit, onClose }) {
    const statusColor = getStatusColor(kit.maxAssemblable);
    const isLow = kit.maxAssemblable === 0 || kit.maxAssemblable <= 2;
    const componentCount = kit.components?.length || 0;

    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div className="so-panel-name">{kit.name}</div>
                    <div className="so-panel-meta">
                        {kit.code ? <span className="mono-sm">{kit.code}</span> : null}
                        {kit.code && componentCount > 0 ? ' · ' : ''}
                        {componentCount} component{componentCount !== 1 ? 's' : ''}
                    </div>
                    <div className="so-panel-stats">
                        <div>
                            <div className="so-stat-label">Available</div>
                            <div className={`so-stat-value ${isLow ? 'so-stat-value--low' : 'so-stat-value--ok'}`}>
                                {kit.maxAssemblable || 0}
                            </div>
                        </div>
                        <div>
                            <div className="so-stat-label">Status</div>
                            <div className="so-stat-value" style={{ color: statusColor, fontSize: 14 }}>
                                {getStatusLabel(kit.maxAssemblable)}
                            </div>
                        </div>
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="so-txn-heading">Components ({componentCount})</div>
            <div className="so-txn-scroll">
                {componentCount > 0 ? (
                    kit.components.map((comp, idx) => {
                        const ok = (comp.currentStock || 0) >= comp.quantity;
                        return (
                            <div key={idx} className="so-txn-row">
                                <div className="so-txn-body">
                                    <div className="so-txn-top">
                                        <span className="so-txn-badge" style={{ color: ok ? '#16a34a' : '#dc2626', background: ok ? '#dcfce7' : '#fee2e2' }}>
                                            {ok ? 'OK' : 'Low'}
                                        </span>
                                        <span className={`so-txn-qty ${ok ? 'so-txn-qty--pos' : 'so-txn-qty--neg'}`}>
                                            {comp.currentStock || 0}/{comp.quantity}
                                        </span>
                                    </div>
                                    <div className="so-txn-date">{comp.itemName}</div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="so-txn-empty">No components</div>
                )}
            </div>
        </div>
    );
}
