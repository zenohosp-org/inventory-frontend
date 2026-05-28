export default function StoreFormModal({
    editingStore, formData,
    buildings, selectedBuilding, selectedFloor, floors,
    hmsLoading, hmsError,
    setField, selectBuilding, selectFloor,
    onSubmit, onClose,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="modal-overlay active">
            <div className="modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {editingStore ? 'Edit Store' : 'Add New Store'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {!editingStore && (
                            <>
                                {hmsLoading && (
                                    <div className="form-group">
                                        <p className="form-help">Loading infrastructure from HMS…</p>
                                    </div>
                                )}
                                {hmsError && (
                                    <div className="form-group">
                                        <p className="form-help form-help--warning">
                                            Could not load HMS infrastructure. You can still save without a location.
                                        </p>
                                    </div>
                                )}
                                {!hmsLoading && buildings.length > 0 && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Block (Building)</label>
                                            <select
                                                className="form-select"
                                                value={selectedBuilding?.id ?? ''}
                                                onChange={(e) => selectBuilding(e.target.value)}
                                            >
                                                <option value="">— Select Block —</option>
                                                {buildings.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Floor</label>
                                            <select
                                                className="form-select"
                                                value={selectedFloor?.id ?? ''}
                                                onChange={(e) => selectFloor(e.target.value)}
                                                disabled={!selectedBuilding}
                                            >
                                                <option value="">— Select Floor —</option>
                                                {floors.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label className="form-label required">Store Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setField('type', e.target.value)}
                                        className="form-select"
                                        required
                                    >
                                        <option value="INVENTORY">Inventory Store</option>
                                        <option value="PHARMACY">Pharmacy Store</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label required">Store Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setField('name', e.target.value)}
                                className="form-input"
                                placeholder="e.g., Ground Floor Pharmacy"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setField('isActive', e.target.checked)}
                                />
                                Active Store
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingStore ? 'Update Store' : 'Create Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
