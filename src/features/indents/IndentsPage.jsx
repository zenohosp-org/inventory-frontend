import React, { useState, useEffect } from 'react';
import { getIndents, getStores } from '../../api/client';
import { Plus, Search, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle, Inbox } from 'lucide-react';
import CreateIndentModal from './modals/CreateIndentModal';
import IndentDetailPanel from './components/IndentDetailPanel';
import PageHeader from '../../components/PageHeader';

export default function IndentsPage() {
    const [indents, setIndents] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedIndent, setSelectedIndent] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [indentsRes, storesRes] = await Promise.all([
                getIndents(),
                getStores()
            ]);
            setIndents(indentsRes.data || []);
            setStores(storesRes.data || []);
        } catch (err) {
            console.error('Failed to load indents', err);
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

    const filteredIndents = indents.filter(ind => {
        if (activeTab !== 'ALL' && ind.status !== activeTab) return false;
        
        if (search) {
            const q = search.toLowerCase();
            return ind.indentNumber.toLowerCase().includes(q) ||
                   getStoreName(ind.sourceStoreId).toLowerCase().includes(q) ||
                   getStoreName(ind.destinationStoreId).toLowerCase().includes(q);
        }
        return true;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case 'DRAFT': return { icon: AlertCircle, color: 'var(--color-gray-500)', bg: 'var(--color-gray-100)', label: 'Draft' };
            case 'PENDING': return { icon: Clock, color: 'var(--color-orange-600)', bg: 'var(--color-orange-50)', label: 'Pending Approval' };
            case 'APPROVED': return { icon: CheckCircle2, color: 'var(--color-blue-600)', bg: 'var(--color-blue-50)', label: 'Approved' };
            case 'PARTIAL_ISSUE': return { icon: CheckCircle2, color: 'var(--color-purple-600)', bg: 'var(--color-purple-50)', label: 'Partial Issue' };
            case 'COMPLETED': return { icon: CheckCircle2, color: 'var(--color-green-600)', bg: 'var(--color-green-50)', label: 'Completed' };
            case 'REJECTED': 
            case 'CANCELLED': return { icon: XCircle, color: 'var(--color-red-600)', bg: 'var(--color-red-50)', label: status === 'REJECTED' ? 'Rejected' : 'Cancelled' };
            default: return { icon: AlertCircle, color: 'var(--color-gray-500)', bg: 'var(--color-gray-100)', label: status };
        }
    };

    return (
        <div className="zu-page">
            <PageHeader 
                title={
                    <>
                        <Inbox size={26} />
                        Ward Indents
                    </>
                }
                subtitle="Manage internal store requests (Wards to Main Store)"
                actions={
                    <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                        <Plus size={18} />
                        Create Indent
                    </button>
                }
            />

            <div className="filter-bar" style={{ marginBottom: 'var(--spacing-4)', gap: '16px', flexWrap: 'wrap' }}>
                <div className="tabs" style={{ display: 'flex', gap: '8px' }}>
                    {['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'PARTIAL_ISSUE', 'COMPLETED'].map(tab => (
                        <button
                            key={tab}
                            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="filter-group flex-1" style={{ maxWidth: '400px' }}>
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search indents..."
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
                        ) : filteredIndents.length === 0 ? (
                            <div className="table-empty">No indents found matching your criteria.</div>
                        ) : (
                            <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Indent #</th>
                                    <th>Date</th>
                                    <th>From (Requesting Ward)</th>
                                    <th>To (Fulfilling Store)</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIndents.map(indent => {
                                    const StatusIcon = getStatusConfig(indent.status).icon;
                                    return (
                                        <tr key={indent.id} onClick={() => setSelectedIndent(indent)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 500, color: 'var(--color-primary-600)' }}>
                                                {indent.indentNumber}
                                            </td>
                                            <td>{new Date(indent.createdAt).toLocaleDateString()}</td>
                                            <td>{getStoreName(indent.destinationStoreId)}</td>
                                            <td>{getStoreName(indent.sourceStoreId)}</td>
                                            <td>
                                                <span className="zu-status-badge" style={{
                                                    backgroundColor: getStatusConfig(indent.status).bg,
                                                    color: getStatusConfig(indent.status).color
                                                }}>
                                                    <StatusIcon size={12} style={{ marginRight: 4 }} />
                                                    {getStatusConfig(indent.status).label}
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

                {selectedIndent && (
                    <IndentDetailPanel
                        indentId={selectedIndent.id}
                        onClose={() => setSelectedIndent(null)}
                        onUpdate={() => {
                            loadData();
                        }}
                        stores={stores}
                    />
                )}
            </div>

            {isCreateOpen && (
                <CreateIndentModal
                    onClose={() => setIsCreateOpen(false)}
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        loadData();
                    }}
                    stores={stores}
                />
            )}
        </div>
    );
}
