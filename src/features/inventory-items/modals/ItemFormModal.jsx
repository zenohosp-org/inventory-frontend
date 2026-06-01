import SearchableSelect from '../../../components/SearchableSelect';
import {
    GST_OPTIONS, UNIT_OPTIONS, DRUG_SCHEDULE_OPTIONS, TRACKING_FLAGS,
} from '../utils/itemHelpers';

export default function ItemFormModal({
    editingItem,
    formData, setFormData,
    categories, itemTypes,
    onSubmit, onClose,
    handleNameChange, handleInputChange, handleCheckboxChange, handleItemTypeSelect,
}) {
    const selectedType = itemTypes.find(t => t.id === formData.itemTypeId);
    const submitDisabled = !formData.name.trim() || !formData.categoryId;
    const isPharmacy = formData.billingGroup === 'PHARMACY';

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="modal-overlay active">
            <div className="modal item-form-modal">
                <div className="modal-header">
                    <h2 className="modal-title">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body item-form-body">

                        {/* BOX 1: Basic Info */}
                        <section className="item-form-section">
                            <header className="item-form-section-header">Basic Info</header>
                            <div className="item-form-section-body">
                                <div className="form-group form-group--flush">
                                    <label className="form-label required">Item Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleNameChange}
                                        className="form-input"
                                        placeholder="Enter product name"
                                        required
                                    />
                                </div>
                                <div className="form-row form-row--flush">
                                    <div className="form-group form-group--flush">
                                        <label className="form-label">Item Code</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Auto-generated"
                                            readOnly={!editingItem}
                                        />
                                    </div>
                                    <div className="form-group form-group--flush">
                                        <label className="form-label required">Category</label>
                                        <SearchableSelect
                                            value={formData.categoryId}
                                            onChange={v => setFormData(p => ({ ...p, categoryId: v }))}
                                            options={categories}
                                            getId={c => c.id}
                                            getLabel={c => c.name}
                                            placeholder="Select Category"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group form-group--flush">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div className="form-row form-row--flush">
                                    <div className="form-group form-group--flush">
                                        <label className="form-label">GST %</label>
                                        <select name="gstPercent" value={formData.gstPercent} onChange={handleInputChange} className="form-select">
                                            {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group form-group--flush">
                                        <label className="form-label">Min Stock (Reorder Level)</label>
                                        <input
                                            type="number"
                                            name="reorderLevel"
                                            value={formData.reorderLevel}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* BOX 2: Inventory Configuration */}
                        <section className="item-form-section">
                            <header className="item-form-section-header">Inventory Configuration</header>
                            <div className="item-form-section-body item-form-section-body--gapped">

                                <div>
                                    <label className="form-label item-form-block-label">Item Type</label>
                                    <div className="item-type-chips">
                                        {itemTypes.map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => handleItemTypeSelect(type)}
                                                className={`item-type-chip ${formData.itemTypeId === type.id ? 'is-selected' : ''}`}
                                            >
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedType && (
                                        <p className="item-form-help">Defaults applied — adjust below if needed.</p>
                                    )}
                                </div>

                                <div>
                                    <div className="item-form-sublabel">Unit &amp; Packaging</div>
                                    <div className="form-row form-row--flush">
                                        <div className="form-group form-group--flush">
                                            <label className="form-label">Base Unit</label>
                                            <select name="unit" value={formData.unit} onChange={handleInputChange} className="form-select">
                                                {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group form-group--flush">
                                            <label className="form-label">
                                                Pack Size <span className="form-label-note">(units per pack)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="packSize"
                                                value={formData.packSize}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="e.g. 100"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isPharmacy && (
                                    <div>
                                        <div className="item-form-sublabel">Pharmacy Details</div>
                                        <div className="form-row form-row--flush form-row--gap-bottom">
                                            <div className="form-group form-group--flush">
                                                <label className="form-label">Generic Name</label>
                                                <input
                                                    type="text"
                                                    name="genericName"
                                                    value={formData.genericName}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="e.g. Paracetamol"
                                                />
                                            </div>
                                            <div className="form-group form-group--flush">
                                                <label className="form-label">HSN Code</label>
                                                <input
                                                    type="text"
                                                    name="hsnCode"
                                                    value={formData.hsnCode}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="e.g. 30049099"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row form-row--flush">
                                            <div className="form-group form-group--flush">
                                                <label className="form-label">Drug Schedule</label>
                                                <select
                                                    name="drugSchedule"
                                                    value={formData.drugSchedule}
                                                    onChange={handleInputChange}
                                                    className="form-select"
                                                >
                                                    {DRUG_SCHEDULE_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group form-group--flush">
                                                <label className="form-label">Reorder Qty</label>
                                                <input
                                                    type="number"
                                                    name="drugReorderQty"
                                                    value={formData.drugReorderQty}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="e.g. 50"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row form-row--flush">
                                            <div className="form-group form-group--flush">
                                                <label className="form-label">
                                                    Units per strip <span className="form-label-note">(for loose-unit sale)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="unitsPerStrip"
                                                    value={formData.unitsPerStrip}
                                                    onChange={handleInputChange}
                                                    className="form-input"
                                                    placeholder="e.g. 10"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="item-form-sublabel">Cost</div>
                                    <div className="form-row form-row--flush">
                                        <div className="form-group form-group--flush">
                                            <label className="form-label">Purchase Price</label>
                                            <input
                                                type="number"
                                                name="purchasePrice"
                                                value={formData.purchasePrice}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="form-group form-group--flush">
                                            <label className="form-label">Selling Price</label>
                                            <input
                                                type="number"
                                                name="sellingPrice"
                                                value={formData.sellingPrice}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="item-form-sublabel">Tracking</div>
                                    <div className="item-form-tracking-row">
                                        {TRACKING_FLAGS.map(([field, label]) => (
                                            <label key={field} className="item-form-checkbox">
                                                <input
                                                    type="checkbox"
                                                    name={field}
                                                    checked={formData[field]}
                                                    onChange={handleCheckboxChange}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </section>

                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitDisabled}>
                            {editingItem ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
