import React, { useState, useEffect } from 'react';
import { getIndents, createDraftIssue } from '../../../api/client';
import { X, Check } from 'lucide-react';

export default function CreateIssueModal({ onClose, onSuccess }) {
    const [indents, setIndents] = useState([]);
    const [selectedIndentId, setSelectedIndentId] = useState('');
    const [selectedIndent, setSelectedIndent] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [issueItems, setIssueItems] = useState({});
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getIndents().then(res => {
            const validIndents = (res.data || []).filter(i => 
                i.status === 'APPROVED' || i.status === 'PARTIAL_ISSUE'
            );
            setIndents(validIndents);
        });
    }, []);

    useEffect(() => {
        if (selectedIndentId) {
            const indent = indents.find(i => i.id === selectedIndentId);
            setSelectedIndent(indent);
            
            if (indent) {
                const initialItems = {};
                indent.items.forEach(item => {
                    const pending = item.requestedQty - item.issuedQty;
                    if (pending > 0) {
                        initialItems[item.inventoryItemId] = {
                            issuedQty: pending,
                            batchNumber: ''
                        };
                    }
                });
                setIssueItems(initialItems);
            }
        } else {
            setSelectedIndent(null);
            setIssueItems({});
        }
    }, [selectedIndentId, indents]);

    const updateIssueQty = (itemId, qty) => {
        setIssueItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], issuedQty: qty }
        }));
    };

    const updateBatchNumber = (itemId, batch) => {
        setIssueItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], batchNumber: batch }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!selectedIndentId) {
            setError("Please select an indent");
            return;
        }

        const itemsToIssue = Object.keys(issueItems).map(itemId => ({
            inventoryItemId: itemId,
            issuedQty: Number(issueItems[itemId].issuedQty),
            batchNumber: issueItems[itemId].batchNumber
        })).filter(i => i.issuedQty > 0);

        if (itemsToIssue.length === 0) {
            setError("Please issue at least one item");
            return;
        }

        try {
            setLoading(true);
            await createDraftIssue({
                indentId: selectedIndentId,
                remarks,
                items: itemsToIssue
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create stock issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ width: '800px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Create Stock Issue</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                
                <div className="modal-body">
                    {error && <div className="po-error-banner mb-4">{error}</div>}
                    
                    <div className="form-group mb-4">
                        <label className="form-label required">Select Indent</label>
                        <select 
                            className="form-input" 
                            value={selectedIndentId}
                            onChange={e => setSelectedIndentId(e.target.value)}
                            required
                        >
                            <option value="">-- Select Approved Indent --</option>
                            {indents.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.indentNumber} (Status: {i.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {selectedIndent && (
                        <>
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
                            
                            <h3 className="mb-3" style={{ fontSize: '16px', fontWeight: '600' }}>Items to Issue</h3>
                            <div className="table-container">
                                <table className="zu-table">
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th style={{ textAlign: 'right' }}>Pending Qty</th>
                                            <th style={{ width: '150px' }}>Issue Qty</th>
                                            <th style={{ width: '200px' }}>Batch No. (Optional)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedIndent.items.map(item => {
                                            const pending = item.requestedQty - item.issuedQty;
                                            if (pending <= 0) return null;
                                            
                                            const issueData = issueItems[item.inventoryItemId] || { issuedQty: 0, batchNumber: '' };
                                            
                                            return (
                                                <tr key={item.id}>
                                                    <td>{item.itemName}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{pending}</td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            className="form-input" 
                                                            style={{ padding: '4px 8px', height: '32px' }}
                                                            min="0"
                                                            max={pending}
                                                            value={issueData.issuedQty}
                                                            onChange={(e) => updateIssueQty(item.inventoryItemId, e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text" 
                                                            className="form-input" 
                                                            style={{ padding: '4px 8px', height: '32px' }}
                                                            placeholder="Batch No"
                                                            value={issueData.batchNumber}
                                                            onChange={(e) => updateBatchNumber(item.inventoryItemId, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !selectedIndentId}>
                        {loading ? 'Creating...' : 'Create Draft Issue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
