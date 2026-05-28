import { X } from 'lucide-react';
import { getStatusLabel } from '../utils/kitHelpers';

export default function KitDetailPanel({ kit, onClose }) {
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
                            <div className="so-stat-pill-wrap">
                                <span className={`kit-status-pill ${isLow ? 'is-low' : 'is-ok'}`}>
                                    {getStatusLabel(kit.maxAssemblable)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="so-panel-body">
                <div className="so-card">
                    <div className="so-card-header">Components ({componentCount})</div>
                    <div className="so-card-body is-flush">
                        {componentCount === 0 ? (
                            <div className="so-txn-empty">No components</div>
                        ) : (
                            <table className="kit-components-table">
                                <colgroup>
                                    <col className="col-item" />
                                    <col className="col-need" />
                                    <col className="col-have" />
                                    <col className="col-status" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th style={{ textAlign: 'right' }}>Need</th>
                                        <th style={{ textAlign: 'right' }}>Have</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kit.components.map((comp, idx) => {
                                        const have = comp.currentStock || 0;
                                        const need = Number(comp.quantity) || 0;
                                        const ok = have >= need;
                                        return (
                                            <tr key={idx}>
                                                <td title={comp.itemName}>{comp.itemName}</td>
                                                <td className="is-num" style={{ textAlign: 'right' }}>{need}</td>
                                                <td className={`is-num ${ok ? 'is-ok' : 'is-low'}`} style={{ textAlign: 'right' }}>{have}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`kit-status-pill ${ok ? 'is-ok' : 'is-low'}`}>
                                                        {ok ? 'OK' : 'Low'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
