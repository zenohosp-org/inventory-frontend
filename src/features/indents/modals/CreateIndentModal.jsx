import React, { useState, useEffect } from 'react';
import { getItems, createDraftIndent, getHmsWards } from '../../../api/client';
import { X, Search, Trash2, Plus } from 'lucide-react';

export default function CreateIndentModal({ onClose, onSuccess, stores }) {
    const [sourceStoreId, setSourceStoreId] = useState('');
    const [destinationStoreId, setDestinationStoreId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [items, setItems] = useState([]);
    
    const [availableItems, setAvailableItems] = useState([]);
    const [itemSearch, setItemSearch] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [hmsWards, setHmsWards] = useState([]);
    const [selectedWardStr, setSelectedWardStr] = useState('');

    useEffect(() => {
        getItems().then(res => {
            setAvailableItems(res.data.filter(item => item.isActive) || []);
        });
        getHmsWards().then(res => {
            setHmsWards(res.data || []);
        }).catch(err => {
            console.error("Failed to fetch HMS wards", err);
        });
    }, []);

    const handleAddItem = (item) => {
        if (!items.find(i => i.inventoryItemId === item.id)) {
            setItems([...items, { inventoryItemId: item.id, itemName: item.name, requestedQty: 1 }]);
        }
        setItemSearch('');
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(i => i.inventoryItemId !== id));
    };

    const updateItemQty = (id, val) => {
        setItems(items.map(i => i.inventoryItemId === id ? { ...i, requestedQty: val } : i));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!sourceStoreId || !selectedWardStr) {
            setError("Please select both source and requesting ward");
            return;
        }
        
        let payload = {
            sourceStoreId,
            remarks,
            items: items.map(i => ({
                inventoryItemId: i.inventoryItemId,
                requestedQty: Number(i.requestedQty)
            }))
        };

        if (selectedWardStr.startsWith('store_')) {
            payload.destinationStoreId = selectedWardStr.replace('store_', '');
        } else if (selectedWardStr.startsWith('ward_')) {
            const wId = Number(selectedWardStr.replace('ward_', ''));
            const wardObj = hmsWards.find(w => w.ward_id === wId);
            if (wardObj) {
                payload.wardId = wardObj.ward_id;
                payload.wardName = wardObj.ward_name;
                payload.buildingId = wardObj.building_id;
                payload.buildingName = wardObj.building_name;
                payload.floorId = wardObj.floor_id;
                payload.floorName = wardObj.floor_name;
            }
        }

        if (payload.destinationStoreId && sourceStoreId === payload.destinationStoreId) {
            setError("Source and destination stores cannot be the same");
            return;
        }
        if (items.length === 0) {
            setError("Please add at least one item to request");
            return;
        }

        try {
            setLoading(true);
            await createDraftIndent(payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create indent');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = itemSearch.length >= 2 
        ? availableItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()))
        : [];

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ width: '800px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Create New Indent</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                
                <div className="modal-body">
                    {error && <div className="po-error-banner mb-4">{error}</div>}
                    
                    <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group">
                            <label className="form-label required">Requesting Ward / Department</label>
                            <select 
                                className="form-input" 
                                value={selectedWardStr}
                                onChange={e => setSelectedWardStr(e.target.value)}
                                required
                            >
                                <option value="">Select Ward / Department...</option>
                                <optgroup label="HMS Infrastructure">
                                    {hmsWards.map(w => (
                                        <option key={`ward_${w.ward_id}`} value={`ward_${w.ward_id}`}>
                                            {w.ward_name} ({w.floor_name}, {w.building_name})
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Inventory Stores">
                                    {stores.map(s => (
                                        <option key={`store_${s.id}`} value={`store_${s.id}`}>{s.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label required">Fulfilling Store (Source Store)</label>
                            <select 
                                className="form-input" 
                                value={sourceStoreId}
                                onChange={e => setSourceStoreId(e.target.value)}
                                required
                            >
                                <option value="">Select Main Store...</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group mb-4">
                        <label className="form-label">Remarks</label>
                        <input 
                            type="text" 
                            className="form-input"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Optional remarks..."
                        />
                    </div>
                    
                    <div className="indent-items-section" style={{ borderTop: '1px solid var(--color-gray-200)', paddingTop: '16px' }}>
                        <div className="flex-between mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Requested Items</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <div className="search-bar" style={{ width: '100%' }}>
                                    <Search size={16} className="search-bar-icon" />
                                    <input
                                        type="text"
                                        className="search-bar-input"
                                        placeholder="Search to add item..."
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                    />
                                </div>
                                
                                {itemSearch.length >= 2 && (
                                    <div className="item-search-results" style={{
                                        position: 'absolute', zIndex: 10, background: 'white', 
                                        border: '1px solid var(--color-gray-200)', borderRadius: '4px',
                                        maxHeight: '200px', overflowY: 'auto', width: '100%', top: 'calc(100% + 4px)', left: 0,
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}>
                                        {filteredItems.length === 0 ? (
                                            <div style={{ padding: '8px 12px', color: 'var(--color-gray-500)' }}>No items found</div>
                                        ) : (
                                            filteredItems.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-gray-100)' }}
                                                    onClick={() => handleAddItem(item)}
                                                    className="item-search-row hover-bg"
                                                >
                                                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>{item.itemCode}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {items.length === 0 ? (
                            <div className="table-empty" style={{ padding: '24px' }}>
                                Search and add items to request.
                            </div>
                        ) : (
                            <table className="zu-table" style={{ marginTop: '8px' }}>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th style={{ width: '150px' }}>Quantity</th>
                                        <th style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.inventoryItemId}>
                                            <td>{item.itemName}</td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    className="form-input" 
                                                    style={{ padding: '4px 8px', height: '32px' }}
                                                    min="1"
                                                    value={item.requestedQty}
                                                    onChange={(e) => updateItemQty(item.inventoryItemId, e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-danger" 
                                                    onClick={() => handleRemoveItem(item.inventoryItemId)}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Draft Indent'}
                    </button>
                </div>
            </div>
            
            <style>{`
                .hover-bg:hover { background-color: var(--color-gray-50); }
            `}</style>
        </div>
    );
}
