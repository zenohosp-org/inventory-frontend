import React, { useState, useEffect } from 'react';
import { getIndentById, submitIndent, approveIndent, rejectIndent, cancelIndent, shortCloseIndent } from '../../../api/client';
import { X, Check, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function IndentDetailPanel({ indentId, onClose, onUpdate, stores }) {
    const [indent, setIndent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [shortCloseRemark, setShortCloseRemark] = useState('');
    const [isShortClosing, setIsShortClosing] = useState(false);
    const [error, setError] = useState(null);

    const loadIndent = async () => {
        try {
            setLoading(true);
            const res = await getIndentById(indentId);
            setIndent(res.data);
        } catch (err) {
            console.error('Failed to load indent details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (indentId) loadIndent();
    }, [indentId]);

    const getStoreName = (id) => {
        const s = stores.find(x => x.id === id);
        return s ? s.name : 'Unknown Store';
    };

    const handleAction = async (actionFn, ...args) => {
        try {
            setError(null);
            await actionFn(indentId, ...args);
            onUpdate();
            loadIndent();
            setIsRejecting(false);
            setIsShortClosing(false);
        } catch (err) {
            setError(err.response?.data?.message || `Action failed`);
        }
    };

    if (loading) {
        return (
            <div className="zu-slide-panel" style={{ right: 0, padding: '24px' }}>
                <div className="zu-loading-state">Loading details...</div>
            </div>
        );
    }

    if (!indent) return null;

    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="so-panel-name">{indent.indentNumber}</div>
                        <span className="zu-status-badge" style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-800)' }}>
                            {indent.status}
                        </span>
                    </div>
                    <div className="so-panel-meta">
                        Created on {new Date(indent.createdAt).toLocaleString()}
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="so-panel-body">
                {error && <div className="po-error-banner mb-4">{error}</div>}

                <div className="so-card mb-4">
                    <div className="so-card-body" style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <div className="so-stat-label">Requesting Ward</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{getStoreName(indent.destinationStoreId)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="so-stat-label">Fulfilling Store</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{getStoreName(indent.sourceStoreId)}</div>
                        </div>
                    </div>
                </div>

                {indent.remarks && (
                    <div className="so-card mb-4">
                        <div className="so-card-body">
                            <div className="so-stat-label">Remarks</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{indent.remarks}</div>
                        </div>
                    </div>
                )}
                
                {indent.rejectionReason && (
                    <div className="so-card mb-4" style={{ borderColor: 'var(--color-red-200)', background: 'var(--color-red-50)' }}>
                        <div className="so-card-body">
                            <div className="so-stat-label" style={{ color: 'var(--color-red-700)' }}>Rejection Reason</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-red-900)' }}>{indent.rejectionReason}</div>
                        </div>
                    </div>
                )}

                <div className="so-card mb-4">
                    <div className="so-card-header">Requested Items</div>
                    <div className="so-card-body is-flush">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th style={{ textAlign: 'right' }}>Requested</th>
                                    <th style={{ textAlign: 'right' }}>Issued</th>
                                    <th style={{ textAlign: 'right' }}>Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {indent.items.map(item => {
                                    const pending = item.requestedQty - item.issuedQty;
                                    return (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                                            <td style={{ textAlign: 'right' }}>{item.requestedQty}</td>
                                            <td style={{ textAlign: 'right', color: item.issuedQty > 0 ? 'var(--color-green-600)' : 'inherit' }}>
                                                {item.issuedQty}
                                            </td>
                                            <td style={{ textAlign: 'right', color: pending > 0 ? 'var(--color-orange-600)' : 'var(--color-green-600)' }}>
                                                {pending}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                    {indent.status === 'DRAFT' && (
                        <>
                            <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--color-red-600)' }} onClick={() => handleAction(cancelIndent)}>
                                Cancel Indent
                            </button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => handleAction(submitIndent)}>
                                Submit for Approval
                            </button>
                        </>
                    )}

                    {indent.status === 'PENDING' && !isRejecting && (
                        <>
                            <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--color-red-600)' }} onClick={() => handleAction(cancelIndent)}>
                                Cancel Indent
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsRejecting(true)}>
                                Reject
                            </button>
                            <button className="btn btn-primary" style={{ flex: 2, background: 'var(--color-green-600)', borderColor: 'var(--color-green-600)' }} onClick={() => handleAction(approveIndent)}>
                                Approve Indent
                            </button>
                        </>
                    )}

                    {isRejecting && (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Reason for rejection..." 
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                style={{ flex: 2 }}
                            />
                            <button className="btn btn-secondary" onClick={() => setIsRejecting(false)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ background: 'var(--color-red-600)', borderColor: 'var(--color-red-600)' }} 
                                onClick={() => handleAction(rejectIndent, { reason: rejectReason })}
                                disabled={!rejectReason}
                            >
                                Confirm Reject
                            </button>
                        </div>
                    )}

                    {indent.status === 'PARTIAL_ISSUE' && !isShortClosing && (
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsShortClosing(true)}>
                            Short-Close Indent
                        </button>
                    )}
                    
                    {isShortClosing && (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Remark for short-close..." 
                                value={shortCloseRemark}
                                onChange={e => setShortCloseRemark(e.target.value)}
                                style={{ flex: 2 }}
                            />
                            <button className="btn btn-secondary" onClick={() => setIsShortClosing(false)}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={() => handleAction(shortCloseIndent, { remark: shortCloseRemark })}
                                disabled={!shortCloseRemark}
                            >
                                Confirm Short-Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
