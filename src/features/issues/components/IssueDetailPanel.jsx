import React, { useState, useEffect } from 'react';
import { getStockIssueById, confirmIssue } from '../../../api/client';
import { X, Check } from 'lucide-react';

export default function IssueDetailPanel({ issueId, onClose, onUpdate, stores }) {
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const loadIssue = async () => {
        try {
            setLoading(true);
            const res = await getStockIssueById(issueId);
            setIssue(res.data);
        } catch (err) {
            console.error('Failed to load issue details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (issueId) loadIssue();
    }, [issueId]);

    const getStoreName = (id) => {
        const s = stores.find(x => x.id === id);
        return s ? s.name : 'Unknown Store';
    };

    const handleConfirm = async () => {
        try {
            setError(null);
            setIsConfirming(true);
            await confirmIssue(issueId);
            onUpdate();
            loadIssue();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm stock issue');
        } finally {
            setIsConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="zu-slide-panel" style={{ right: 0, padding: '24px' }}>
                <div className="zu-loading-state">Loading details...</div>
            </div>
        );
    }

    if (!issue) return null;

    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="so-panel-name">{issue.issueNumber}</div>
                        <span className="zu-status-badge" style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-800)' }}>
                            {issue.status}
                        </span>
                    </div>
                    <div className="so-panel-meta">
                        Created on {new Date(issue.createdAt).toLocaleString()}
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
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{getStoreName(issue.destinationStoreId)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="so-stat-label">Fulfilling Store</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{getStoreName(issue.sourceStoreId)}</div>
                        </div>
                    </div>
                </div>

                {issue.remarks && (
                    <div className="so-card mb-4">
                        <div className="so-card-body">
                            <div className="so-stat-label">Remarks</div>
                            <div className="so-panel-meta" style={{ marginTop: '4px', color: 'var(--color-gray-900)' }}>{issue.remarks}</div>
                        </div>
                    </div>
                )}
                
                <div className="so-card mb-4">
                    <div className="so-card-header">Issued Items</div>
                    <div className="so-card-body is-flush">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Batch No.</th>
                                    <th style={{ textAlign: 'right' }}>Issued Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issue.items.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                                        <td>{item.batchNumber || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{item.issuedQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {issue.status === 'DRAFT' && (
                        <button 
                            className="btn btn-primary" 
                            style={{ background: 'var(--color-green-600)', borderColor: 'var(--color-green-600)' }} 
                            onClick={handleConfirm}
                            disabled={isConfirming}
                        >
                            {isConfirming ? 'Confirming...' : 'Confirm Issue (Deduct Stock)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
