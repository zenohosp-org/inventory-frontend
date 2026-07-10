import { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { getStockLogs } from '../api/client';
import { stripHospitalPrefix } from '../utils/format';
import PageHeader from '../components/PageHeader';
export default function StockLog() {
    const [transactions, setTransactions] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [pageIndex, setPageIndex] = useState(0);
    const pageSize = 20;

    // Debounce the search input so we don't hammer the backend on every keystroke.
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
        return () => clearTimeout(id);
    }, [searchQuery]);

    // Reset to first page whenever filters change.
    useEffect(() => { setPageIndex(0); }, [debouncedSearch, filterType]);

    useEffect(() => {
        let cancelled = false;
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const res = await getStockLogs({
                    page: pageIndex,
                    size: pageSize,
                    search: debouncedSearch || undefined,
                    type: filterType !== 'all' ? filterType : undefined,
                });
                if (cancelled) return;
                let payload = res.data || res;
                if (typeof payload === 'string') payload = JSON.parse(payload);
                const content = Array.isArray(payload?.content) ? payload.content : [];
                setTransactions(content);
                setTotalElements(payload?.totalElements ?? content.length);
                setTotalPages(payload?.totalPages ?? 1);
            } catch (error) {
                if (cancelled) return;
                console.error('Error fetching stock log:', error);
                setTransactions([]);
                setTotalElements(0);
                setTotalPages(0);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchTransactions();
        return () => { cancelled = true; };
    }, [pageIndex, debouncedSearch, filterType]);

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
            case 'TRANSFER_OUT':
                return 'badge-primary';
            case 'TRANSFER_IN':
                return 'badge-accent';
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
            case 'TRANSFER_OUT':
                return 'Transfer Out';
            case 'TRANSFER_IN':
                return 'Transfer In';
            default:
                return type;
        }
    };

    const rangeStart = totalElements === 0 ? 0 : pageIndex * pageSize + 1;
    const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalElements);

    return (
        <div className="zu-page">
            {/* Page Header */}
            <PageHeader 
                title={
                    <>
                        <History size={26} />
                        Stock Transaction Log
                    </>
                }
                subtitle="Complete audit trail of all inventory movements and adjustments."
            />
            <div className="zu-page-content">


            {/* Filter Bar */}
            <div className="filter-bar">
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
                        <option value="TRANSFER_OUT">Transfer Out</option>
                        <option value="TRANSFER_IN">Transfer In</option>
                    </select>
                </div>
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-bar-input"
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="zu-table-wrapper">
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : transactions.length === 0 ? (
                        <div className="table-empty">No transactions found.</div>
                    ) : (
                        <table className="zu-table table-striped">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th className="text-right">Quantity</th>
                                    <th className="text-right">Balance</th>
                                    <th>Store</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn, idx) => (
                                    <tr key={txn.id || idx}>
                                        <td>
                                            <span className="text-xs text-muted">
                                                {new Date(txn.createdAt).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{txn.itemName}</strong>
                                            <span className="subtext">{txn.itemCode ? `Code: ${stripHospitalPrefix(txn.itemCode)}` : '-'}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getTransactionTypeColor(txn.transactionType)}`}>
                                                {getTransactionTypeLabel(txn.transactionType)}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <strong className={txn.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                            </strong>
                                        </td>
                                        <td className="text-right text-muted">{txn.balanceAfter || '-'}</td>
                                        <td className="text-muted">{txn.storeName || '—'}</td>
                                        <td className="text-muted">{txn.createdByName || 'System'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span className="table-info">
                        Showing {rangeStart} to {rangeEnd} of {totalElements} transactions
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
        </div>
    );
}
