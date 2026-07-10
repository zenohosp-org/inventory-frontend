import { X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';

export default function ConsumeKitModal({
    kit, stores,
    consumeForm, setConsumeForm,
    lowStockWarning, submitting,
    onSubmit, onClose,
}) {
    const submitDisabled = submitting || !consumeForm.storeId || !consumeForm.quantity || (lowStockWarning && !consumeForm.force);

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ maxWidth: '580px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Consume Kit — {kit.name}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    {lowStockWarning && (
                        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', fontSize: '0.9rem', color: '#92400e' }}>
                            <strong>⚠️ Low Stock Warning</strong><br />
                            Some items have insufficient stock:
                            <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                                {lowStockWarning.map((item, idx) => (
                                    <li key={idx}><strong>{item.itemName}</strong>: needs {item.needed}, have {item.available}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Store *</label>
                        <SearchableSelect
                            value={consumeForm.storeId}
                            onChange={v => setConsumeForm(prev => ({ ...prev, storeId: v }))}
                            options={stores}
                            getId={s => s.id}
                            getLabel={s => s.name}
                            placeholder="Select Store"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Quantity to Consume *</label>
                        <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={consumeForm.quantity}
                            onChange={(e) => setConsumeForm(prev => ({ ...prev, quantity: e.target.value }))}
                        />
                    </div>

                    {kit.components && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600' }}>Component Breakdown</h4>
                            <div className="zu-table-wrapper"><table className="zu-table">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Item</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Needed</th>
                                        <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Available</th>
                                        <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kit.components.map((comp, idx) => {
                                        const needed = consumeForm.quantity ? Number(consumeForm.quantity) * Number(comp.quantity) : 0;
                                        const available = comp.currentStock || 0;
                                        const isOk = available >= needed;
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: '0.5rem 0' }}>{comp.itemName}</td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>
                                                    {needed}
                                                    <span className="kit-needed-per-kit">({comp.quantity}/kit)</span>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>{available}</td>
                                                <td style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                                    {isOk
                                                        ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                                                        : <span style={{ color: '#dc2626', fontWeight: 600 }}>✗</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table></div>
                        </div>
                    )}

                    {lowStockWarning && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={consumeForm.force}
                                onChange={(e) => setConsumeForm(prev => ({ ...prev, force: e.target.checked }))}
                                style={{ cursor: 'pointer' }}
                            />
                            <span>Proceed anyway (deduct available quantity)</span>
                        </label>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={onSubmit} disabled={submitDisabled}>
                        {submitting ? 'Processing...' : 'Confirm Consumption'}
                    </button>
                </div>
            </div>
        </div>
    );
}
