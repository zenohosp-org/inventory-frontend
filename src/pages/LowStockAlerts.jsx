import React, { useState, useEffect } from 'react';
import { getLowStockAlerts, autoGeneratePOs } from '../api/client';
import { AlertTriangle, RefreshCw, ShoppingCart, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const LowStockAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [generating, setGenerating] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await getLowStockAlerts();
            setAlerts(res.data);
            setSelectedItems(new Set());
        } catch (error) {
            console.error("Error fetching low stock alerts:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const toggleSelect = (itemId) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItems(newSet);
    };

    const getCategory = (billingGroup) => {
        if (billingGroup === 'PHARMACY') return 'Pharmacy';
        if (billingGroup === 'ASSET') return 'Asset';
        return 'Hospital';
    };

    const displayedAlerts = alerts.filter(a => {
        if (filterCategory === 'All') return true;
        return getCategory(a.billingGroup) === filterCategory;
    });

    const validAlerts = displayedAlerts.filter(a => a.preferredVendorId);

    const toggleSelectAll = () => {
        if (selectedItems.size === validAlerts.length && validAlerts.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(validAlerts.map(a => a.itemId)));
        }
    };

    const handleGeneratePOs = async () => {
        if (selectedItems.size === 0) return;
        setGenerating(true);
        try {
            await autoGeneratePOs(Array.from(selectedItems));
            navigate('/purchase-orders');
        } catch (error) {
            alert('Failed to generate POs');
            console.error(error);
        }
        setGenerating(false);
    };

    const tabs = ['All', 'Hospital', 'Pharmacy', 'Asset'];

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <AlertTriangle size={24} style={{ marginRight: '8px', color: '#ef4444' }} />
                        Low Stock Alerts
                    </>
                }
                subtitle="Items that have fallen below their reorder level."
                actions={
                    <>
                        <button 
                            onClick={handleGeneratePOs}
                            disabled={selectedItems.size === 0 || generating}
                            className="btn btn-primary"
                        >
                            {generating ? <RefreshCw className="spin" size={16} /> : <ShoppingCart size={16} />}
                            <span style={{ marginLeft: '8px' }}>Generate Draft POs ({selectedItems.size})</span>
                        </button>
                    </>
                }
            />

            <div className="zu-page-content">

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="empty-state">
                    <CheckSquare size={48} className="empty-state-icon" style={{ color: '#22c55e' }} />
                    <h3 className="empty-state-title">Stock Levels are Healthy</h3>
                    <p className="empty-state-desc">No items are currently below their reorder levels.</p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="table-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', width: '100%' }}>
                            {tabs.map(tab => {
                                const count = tab === 'All' ? alerts.length : alerts.filter(a => getCategory(a.billingGroup) === tab).length;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => { setFilterCategory(tab); setSelectedItems(new Set()); }}
                                        style={{
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: filterCategory === tab ? '2px solid #1e293b' : '2px solid transparent',
                                            color: filterCategory === tab ? '#1e293b' : '#64748b',
                                            fontWeight: filterCategory === tab ? '600' : '500',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {tab} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="zu-table-wrapper">
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '48px', textAlign: 'center' }}>
                                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-slate-800" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            {selectedItems.size === validAlerts.length && validAlerts.length > 0 ? 
                                                <CheckSquare size={18} style={{ color: '#1e293b' }} /> : 
                                                <Square size={18} />}
                                        </button>
                                    </th>
                                    <th>Item Details</th>
                                    <th>Preferred Vendor</th>
                                    <th style={{ textAlign: 'right' }}>Current Stock</th>
                                    <th style={{ textAlign: 'right' }}>Reorder Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                                            No {filterCategory !== 'All' ? filterCategory : ''} items are below reorder level.
                                        </td>
                                    </tr>
                                ) : displayedAlerts.map((alert) => {
                                    const hasVendor = !!alert.preferredVendorId;
                                    const isSelected = selectedItems.has(alert.itemId);
                                    return (
                                        <tr key={alert.itemId} className={isSelected ? 'selected-row' : ''}>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => hasVendor && toggleSelect(alert.itemId)} 
                                                    disabled={!hasVendor}
                                                    style={{ background: 'none', border: 'none', cursor: hasVendor ? 'pointer' : 'not-allowed', opacity: hasVendor ? 1 : 0.3 }}
                                                >
                                                    {isSelected ? <CheckSquare size={18} style={{ color: '#1e293b' }} /> : <Square size={18} style={{ color: '#9ca3af' }} />}
                                                </button>
                                            </td>
                                            <td>
                                                <strong>{alert.itemName}</strong>
                                                <div className="mono text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>{alert.itemCode}</div>
                                            </td>
                                            <td>
                                                {hasVendor ? (
                                                    <span>{alert.preferredVendorName}</span>
                                                ) : (
                                                    <span className="badge badge-warning">No Preferred Vendor</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <strong className="text-danger">{alert.currentStock}</strong>
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="text-muted">
                                                {alert.reorderLevel}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default LowStockAlerts;
