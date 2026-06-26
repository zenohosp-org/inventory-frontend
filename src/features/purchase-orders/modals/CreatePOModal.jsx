import { X, Plus } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';

export default function CreatePOModal({
    formData, setFormData,
    vendors, activeStores, items,
    onSubmit, onClose,
}) {
    const handleItemChange = (idx, field, value) => {
        const next = [...formData.items];
        next[idx] = { ...next[idx], [field]: value };
        setFormData(f => ({ ...f, items: next }));
    };

    const handleItemSelect = (idx, selectedItem) => {
        const next = [...formData.items];
        next[idx] = {
            ...next[idx],
            itemId: selectedItem.id,
            gstPercent: selectedItem.gstPercent ?? 0,
            unitPrice: selectedItem.purchasePrice ?? next[idx].unitPrice ?? 0,
        };
        setFormData(f => ({ ...f, items: next }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const estimatedTotal = formData.items.reduce((sum, i) => {
        const base = Number(i.quantity) * Number(i.unitPrice);
        return sum + base + base * ((Number(i.gstPercent) || 0) / 100);
    }, 0);

    return (
        <div className="modal-overlay active">
            <div className="modal po-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Create Purchase Order</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label required">Vendor</label>
                            <SearchableSelect
                                value={formData.vendorId}
                                onChange={v => setFormData(f => ({ ...f, vendorId: v }))}
                                options={vendors}
                                getId={v => v.id}
                                getLabel={v => v.name}
                                placeholder="Select Vendor"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Store</label>
                            <SearchableSelect
                                value={formData.storeId}
                                onChange={v => setFormData(f => ({ ...f, storeId: v }))}
                                options={activeStores}
                                getId={s => s.id}
                                getLabel={s => s.name}
                                placeholder="Select Store"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Expected Delivery Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.expectedDate}
                                onChange={e => setFormData(f => ({ ...f, expectedDate: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Line Items</label>
                            <div className="po-line-items">
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="po-line-item">
                                        <div style={{ flex: 2 }}>
                                            <span className="po-line-item-label">Product</span>
                                            <SearchableSelect
                                                value={item.itemId}
                                                onChange={v => {
                                                    const found = items.find(i => i.id === v);
                                                    if (found) handleItemSelect(idx, found);
                                                    else handleItemChange(idx, 'itemId', '');
                                                }}
                                                options={items}
                                                getId={i => i.id}
                                                getLabel={i => i.name}
                                                placeholder="Search product..."
                                                required={!item.itemId}
                                            />
                                        </div>
                                        <div>
                                            <span className="po-line-item-label">GST %</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-input"
                                                value={item.gstPercent}
                                                onChange={e => handleItemChange(idx, 'gstPercent', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <span className="po-line-item-label">Qty</span>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-input"
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <span className="po-line-item-label">Unit Price (₹)</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-input"
                                                value={item.unitPrice}
                                                onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger po-remove-btn"
                                            onClick={() => setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary po-add-item"
                                onClick={() => setFormData(f => ({ ...f, items: [...f.items, { itemId: '', quantity: 1, unitPrice: 0, gstPercent: 0 }] }))}
                            >
                                <Plus size={15} />
                                Add Item
                            </button>
                        </div>

                        <div className="po-est-total">
                            Estimated Total: <strong>₹{estimatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create PO</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
