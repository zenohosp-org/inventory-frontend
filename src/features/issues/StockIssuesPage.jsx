import React, { useState, useEffect } from 'react';
import { getStockIssues, getStores } from '../../api/client';
import { Plus, Search, ChevronRight, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import CreateIssueModal from './modals/CreateIssueModal';
import IssueDetailPanel from './components/IssueDetailPanel';
import PageHeader from '../../components/PageHeader';

export default function StockIssuesPage() {
    const [issues, setIssues] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [issuesRes, storesRes] = await Promise.all([
                getStockIssues(),
                getStores()
            ]);
            setIssues(issuesRes.data || []);
            setStores(storesRes.data || []);
        } catch (err) {
            console.error('Failed to load stock issues', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getStoreName = (id) => {
        const s = stores.find(x => x.id === id);
        return s ? s.name : 'Unknown Store';
    };

    const filteredIssues = issues.filter(issue => {
        if (search) {
            const q = search.toLowerCase();
            return issue.issueNumber.toLowerCase().includes(q) ||
                   getStoreName(issue.sourceStoreId).toLowerCase().includes(q) ||
                   getStoreName(issue.destinationStoreId).toLowerCase().includes(q);
        }
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'DRAFT': return { icon: AlertCircle, color: 'var(--color-gray-500)', bg: 'var(--color-gray-100)', label: 'Draft' };
            case 'ISSUED': return { icon: CheckCircle2, color: 'var(--color-green-600)', bg: 'var(--color-green-50)', label: 'Issued' };
            default: return { icon: AlertCircle, color: 'var(--color-gray-500)', bg: 'var(--color-gray-100)', label: status };
        }
    };

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <Send size={26} />
                        Stock Issues
                    </>
                }
                subtitle="Manage stock distribution against approved indents"
                actions={
                    <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                        <Plus size={18} />
                        Create Issue
                    </button>
                }
            />

            <div className="filter-bar" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div className="filter-group flex-1">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-bar-input"
                        />
                        {search && (
                            <button className="search-bar-clear" onClick={() => setSearch('')}>×</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="so-layout">
                <div className="table-container so-table-wrap">
                    <div className="zu-table-wrapper">
                        {loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="table-empty">No stock issues found.</div>
                        ) : (
                            <table className="zu-table">
                                <thead>
                                    <tr>
                                        <th>Issue #</th>
                                        <th>Date</th>
                                        <th>From (Main Store)</th>
                                        <th>To (Ward)</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIssues.map(issue => {
                                        const StatusIcon = getStatusConfig(issue.status).icon;
                                        return (
                                            <tr key={issue.id} onClick={() => setSelectedIssue(issue)} style={{ cursor: 'pointer' }}>
                                                <td style={{ fontWeight: 500, color: 'var(--color-primary-600)' }}>
                                                    {issue.issueNumber}
                                                </td>
                                                <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                                                <td>{getStoreName(issue.sourceStoreId)}</td>
                                                <td>{getStoreName(issue.destinationStoreId)}</td>
                                                <td>
                                                    <span className="zu-status-badge" style={{
                                                        backgroundColor: getStatusConfig(issue.status).bg,
                                                        color: getStatusConfig(issue.status).color
                                                    }}>
                                                        <StatusIcon size={12} style={{ marginRight: 4 }} />
                                                        {getStatusConfig(issue.status).label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="zu-icon-btn">
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {selectedIssue && (
                    <IssueDetailPanel
                        issueId={selectedIssue.id}
                        onClose={() => setSelectedIssue(null)}
                        onUpdate={() => {
                            loadData();
                        }}
                        stores={stores}
                    />
                )}
            </div>

            {isCreateOpen && (
                <CreateIssueModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
