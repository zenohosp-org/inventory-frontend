import { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { getStockLogs } from '../api/client';


export default function StockLog() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [pageIndex, setPageIndex] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        // Apply filters
        let filtered = transactions;
        
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.itemCode?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(t => t.transactionType === filterType);
        }

        setFilteredTransactions(filtered);
        setPageIndex(0);
    }, [searchQuery, filterType, transactions]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await getStockLogs();
            const transData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
            setTransactions(transData);
        } catch (error) {
            console.error('Error fetching stock log:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'PURCHASE_IN':
                return 'badge-success';
            case 'INTERNAL_USE':
                return 'badge-error';
            case 'RETURN':
                return 'badge-accent';
            case 'EXPIRED_DISPOSED':
                return 'badge-warning';
            default:
                return 'badge-gray';
        }
    };

    const getTransactionTypeLabel = (type) => {
        switch (type) {
            case 'PURCHASE_IN':
                return '📥 Purchase In';
            case 'INTERNAL_USE':
                return '📤 Internal Use';
            case 'RETURN':
                return '↩️ Return';
            case 'EXPIRED_DISPOSED':
                return '🗑️ Disposed';
            default:
                return type;
        }
    };

    const paginatedTransactions = filteredTransactions.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize
    );

    const totalPages = Math.ceil(filteredTransactions.length / pageSize);

    return (
        <div className="main-content">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title flex" style={{ alignItems: 'center', gap: 'var(--spacing-4)' }}>
                    <History size={28} style={{ color: 'var(--color-primary)' }} />
                    Stock Transaction Log
                </h1>
                <p className="page-subtitle">
                    Complete audit trail of all inventory movements and adjustments.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-group" style={{ flex: 1 }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                        <Search size={18} style={{ color: 'var(--color-gray-500)' }} />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="filter-input"
                            style={{ backgroundColor: 'transparent', border: 'none', flex: 1 }}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Transaction Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Types</option>
                        <option value="PURCHASE_IN">Purchase In</option>
                        <option value="INTERNAL_USE">Internal Use</option>
                        <option value="RETURN">Return</option>
                        <option value="EXPIRED_DISPOSED">Disposed</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Transactions ({filteredTransactions.length})</h3>
                </div>

                <div className="table-body">
                    {loading ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                            No transactions found.
                        </div>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th style={{ width: '18%' }}>Timestamp</th>
                                    <th style={{ width: '25%' }}>Product</th>
                                    <th style={{ width: '15%' }}>Type</th>
                                    <th style={{ width: '10%', textAlign: 'right' }}>Quantity</th>
                                    <th style={{ width: '10%', textAlign: 'right' }}>Balance</th>
                                    <th style={{ width: '15%' }}>Store</th>
                                    <th style={{ width: '7%' }}>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTransactions.map((txn, idx) => (
                                    <tr key={txn.id || idx}>
                                        <td>
                                            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)' }}>
                                                {new Date(txn.createdAt).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <strong>{txn.itemName}</strong>
                                            </div>
                                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-gray-500)' }}>
                                                {txn.itemCode ? `Code: ${txn.itemCode}` : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getTransactionTypeColor(txn.transactionType)}`}>
                                                {getTransactionTypeLabel(txn.transactionType)}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <strong style={{
                                                color: txn.quantity > 0 ? 'var(--color-success)' : 'var(--color-error)'
                                            }}>
                                                {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                            </strong>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <span style={{ color: 'var(--color-gray-700)' }}>
                                                {txn.balanceAfter || '-'}
                                            </span>
                                        </td>
                                        <td className="text-muted">{txn.storeName || 'N/A'}</td>
                                        <td style={{ fontSize: 'var(--fs-xs)' }}>
                                            {txn.createdBy || 'System'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span className="table-info">
                        Showing {filteredTransactions.length === 0 ? 0 : pageIndex * pageSize + 1} to {Math.min((pageIndex + 1) * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </span>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button className="pagination-item" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>
                                ← Previous
                            </button>
                            {(() => {
                                const visible = Math.min(totalPages, 5);
                                const start = Math.max(0, Math.min(pageIndex - 2, totalPages - visible));
                                return Array.from({ length: visible }).map((_, i) => {
                                    const page = start + i;
                                    return (
                                        <button
                                            key={page}
                                            className={`pagination-item ${pageIndex === page ? 'active' : ''}`}
                                            onClick={() => setPageIndex(page)}
                                        >
                                            {page + 1}
                                        </button>
                                    );
                                });
                            })()}
                            <button className="pagination-item" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex(pageIndex + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
