import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, X, AlertCircle, Search } from 'lucide-react';
import {
    getPurchaseOrders, createPurchaseOrder,
    getVendors, getItems, getStores,
    recordPOReceipt,
    payAdvancePO, getFinanceBankAccounts, createFinanceBankTransaction,
    getPOBills, getGrns,
    createAsset, getAssets, logStock,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import { withCache } from '../cache';
import SearchableSelect from '../components/SearchableSelect';
import './PurchaseOrders.css';

const STATUS_MAP = {
    ORDERED: { label: 'Ordered', color: 'badge-primary' },
    PARTIALLY_RECEIVED: { label: 'Partial', color: 'badge-warning' },
    RECEIVED: { label: 'Received', color: 'badge-success' },
    BILLED: { label: 'Billed', color: 'badge-secondary' },
};

const EMPTY_FORM = { vendorId: '', storeId: '', expectedDate: '', items: [{ itemId: '', quantity: 1, unitPrice: 0, gstPercent: 0 }] };
const EMPTY_PAY = { paidAmount: '', bankAccountId: '', referenceNo: '' };

export default function PurchaseOrders() {
    const { user } = useAuth();
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [activeStores, setActiveStores] = useState([]);
    const [billsByPoId, setBillsByPoId] = useState({});
    const [grnsByPoId, setGrnsByPoId] = useState({});
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPOId, setSelectedPOId] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [receiptModal, setReceiptModal] = useState(null);
    const [receiptQtys, setReceiptQtys] = useState({});

    const [payModal, setPayModal] = useState(null);
    const [payForm, setPayForm] = useState(EMPTY_PAY);
    const [bankLoading, setBankLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const pageSize = 20;

    useEffect(() => { fetchData(); }, []);

    const extractArray = (res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) return data;
        try { const p = JSON.parse(data); return Array.isArray(p) ? p : []; } catch { return []; }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [posRes, vendsRes, itemsRes, storesRes, billsRes, grnsRes] = await Promise.all([
                getPurchaseOrders(), withCache('vendors', getVendors), withCache('items', getItems), withCache('stores', getStores), getPOBills(), getGrns(),
            ]);
            setPos(extractArray(posRes));
            setVendors(extractArray(vendsRes));
            setItems(extractArray(itemsRes));
            setActiveStores(extractArray(storesRes).filter(s => s?.isActive));
            const billMap = {};
            extractArray(billsRes).forEach(b => {
                const poId = b.purchaseOrder?.id;
                if (poId) billMap[poId] = b;
            });
            setBillsByPoId(billMap);
            const grnMap = {};
            extractArray(grnsRes).forEach(g => {
                const poId = g.purchaseOrder?.id;
                if (!poId) return;
                if (!grnMap[poId]) grnMap[poId] = [];
                grnMap[poId].push(g);
            });
            setGrnsByPoId(grnMap);
        } catch (e) {
            setError('Failed to load data. ' + (e.response?.data?.message || e.message));
            setPos([]); setVendors([]); setItems([]); setActiveStores([]); setBillsByPoId({}); setGrnsByPoId({});
        } finally {
            setLoading(false);
        }
    };

    // ── Create PO ──
    const handleItemChange = (idx, field, value) => {
        const next = [...formData.items];
        next[idx] = { ...next[idx], [field]: value };
        setFormData(f => ({ ...f, items: next }));
    };

    const handleItemSelect = (idx, selectedItem) => {
        const next = [...formData.items];
        next[idx] = {
            ...next[idx],
            itemId: selectedItem.id,
            gstPercent: selectedItem.gstPercent ?? 0,
        };
        setFormData(f => ({ ...f, items: next }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const validItems = formData.items.filter(i => i.itemId && i.quantity > 0);
        if (!formData.vendorId) { alert('Please select a vendor'); return; }
        if (!formData.storeId) { alert('Please select a store'); return; }
        if (validItems.length === 0) { alert('Please add at least one item'); return; }
        try {
            await createPurchaseOrder({
                vendorId: formData.vendorId,
                storeId: formData.storeId,
                expectedDate: formData.expectedDate || null,
                items: validItems.map(i => ({
                    itemId: i.itemId,
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice) || 0,
                })),
            });
            setShowCreateModal(false);
            setFormData(EMPTY_FORM);
            await fetchData();
        } catch (e) {
            alert('Failed to create PO: ' + (e.response?.data?.message || e.message));
        }
    };

    // ── Record Receipt ──
    const openReceiptModal = (po) => {
        const init = {};
        (po.items || []).forEach(item => {
            init[item.id] = { qty: '', storeId: po.store?.id || '', batchNumber: '', expiryDate: '', mrp: '', sellingPrice: '' };
        });
        setReceiptQtys(init);
        setReceiptModal(po);
    };

    const handleReceiptSubmit = async () => {
        const items = Object.entries(receiptQtys)
            .filter(([, val]) => val.qty !== '' && Number(val.qty) > 0)
            .map(([poItemId, val]) => {
                const poItem = receiptModal.items.find(i => i.id === poItemId);
                const isPharmacy = poItem?.inventoryItem?.billingGroup === 'PHARMACY';
                return {
                    poItemId,
                    storeId: val.storeId || null,
                    receivedQty: Number(val.qty),
                    batchNumber: val.batchNumber || null,
                    expiryDate: val.expiryDate || null,
                    mrp: isPharmacy && val.mrp !== '' ? Number(val.mrp) : null,
                    sellingPrice: isPharmacy && val.sellingPrice !== '' ? Number(val.sellingPrice) : null,
                };
            });
        if (items.length === 0) return;

        // Validate required fields per item
        const missingFields = [];
        for (const item of items) {
            const poItem = receiptModal.items.find(i => i.id === item.poItemId);
            const val = receiptQtys[item.poItemId];
            const isPharmacy = poItem?.inventoryItem?.billingGroup === 'PHARMACY';
            if (!item.storeId) {
                missingFields.push(`${poItem.inventoryItem.name}: Store required`);
            }
            if ((poItem?.inventoryItem?.batchRequired || isPharmacy) && !val?.batchNumber?.trim()) {
                missingFields.push(`${poItem.inventoryItem.name}: Batch No required`);
            }
            if ((poItem?.inventoryItem?.expiryRequired || isPharmacy) && !val?.expiryDate?.trim()) {
                missingFields.push(`${poItem.inventoryItem.name}: Expiry Date required`);
            }
        }
        if (missingFields.length > 0) {
            alert('Please fill in required fields:\n\n' + missingFields.join('\n'));
            return;
        }
        setSubmitting(true);
        try {
            await recordPOReceipt(receiptModal.id, items);

            // Auto-create assets for items routed to Asset module (billingGroup === 'ASSET')
            const hasAssetItems = receiptModal?.items?.some(
                item => item.inventoryItem?.billingGroup === 'ASSET'
            );

            if (hasAssetItems) {
                const assetsRes = await getAssets(user?.token);
                const existingAssets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
                // Track codes generated in this run so same-prefix items don't collide
                const generatedCodes = new Set();

                for (const item of items) {
                    const poItem = receiptModal.items.find(i => i.id === item.poItemId);
                    const inv = poItem?.inventoryItem;
                    if (inv?.billingGroup !== 'ASSET') continue;

                    const prefix = (inv.name || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
                    const existingForPrefix = existingAssets.filter(a => a.assetCode?.startsWith(prefix + '-'));
                    // Find highest sequence number already used (DB + this run) to avoid gaps causing collisions
                    const maxExisting = existingForPrefix.reduce((max, a) => {
                        const n = parseInt(a.assetCode?.split('-').pop(), 10);
                        return isNaN(n) ? max : Math.max(max, n);
                    }, 0);
                    const maxGenerated = [...generatedCodes]
                        .filter(c => c.startsWith(prefix + '-'))
                        .reduce((max, c) => {
                            const n = parseInt(c.split('-').pop(), 10);
                            return isNaN(n) ? max : Math.max(max, n);
                        }, 0);
                    const baseSeq = Math.max(maxExisting, maxGenerated);
                    const qty = item.receivedQty;

                    const poDate = receiptModal.createdAt ? receiptModal.createdAt.split('T')[0] : null;
                    const createPromises = [];
                    for (let i = 0; i < qty; i++) {
                        const code = `${prefix}-${String(baseSeq + i + 1).padStart(3, '0')}`;
                        generatedCodes.add(code);
                        createPromises.push(createAsset({
                            assetName: inv.name,
                            assetCode: code,
                            description: `Auto-created from PO receipt: ${receiptModal.poNumber}`,
                            status: 'ACTIVE',
                            vendor: receiptModal.vendor?.id ? { id: receiptModal.vendor.id } : null,
                            purchaseDate: poDate,
                            purchasePrice: poItem?.unitPrice || null,
                        }, user?.token));
                    }
                    await Promise.all(createPromises);

                    const startCode = `${prefix}-${String(baseSeq + 1).padStart(3, '0')}`;
                    const endCode = `${prefix}-${String(baseSeq + qty).padStart(3, '0')}`;
                    await logStock({
                        movementType: 'ASSET_OUT',
                        storeId: items.find(i => i.poItemId === item.poItemId)?.storeId || null,
                        itemId: inv.id,
                        quantity: qty,
                        notes: `Auto-labeled from PO: ${receiptModal.poNumber} — ${qty > 1 ? `${startCode} to ${endCode}` : startCode}`,
                    });
                }
            }

            setReceiptModal(null);
            await fetchData();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getDestination = (inv) => {
        if (!inv) return null;
        if (inv.billingGroup === 'ASSET') return { label: 'Asset Register', color: '#8b5cf6' };
        if (inv.billingGroup === 'PHARMACY') return { label: 'Pharmacy Stock', color: '#10b981' };
        if (inv.billingGroup === 'OT') return { label: 'OT Stock', color: '#f59e0b' };
        if (inv.billingGroup === 'ROOM') return { label: 'Room / Ward Stock', color: '#3b82f6' };
        return { label: 'Main Inventory', color: '#64748b' };
    };

    // ── Pay Advance ──
    const openPayModal = async (po) => {
        setPayModal({ ...po, bill: billsByPoId[po.id] || null });
        setPayForm(EMPTY_PAY);
        setBankLoading(true);
        try {
            const res = await getFinanceBankAccounts();
            setBankAccounts(Array.isArray(res.data) ? res.data : []);
        } catch {
            setBankAccounts([]);
        } finally {
            setBankLoading(false);
        }
    };

    const handlePaySubmit = async () => {
        if (!payForm.paidAmount || Number(payForm.paidAmount) <= 0) {
            alert('Enter a valid amount'); return;
        }
        setSubmitting(true);
        const selectedAccount = bankAccounts.find(a => a.id === payForm.bankAccountId);
        try {
            // 1. Record DEBIT in finance (best-effort — don't abort on failure)
            if (payForm.bankAccountId) {
                try {
                    await createFinanceBankTransaction(payForm.bankAccountId, {
                        type: 'DEBIT',
                        amount: Number(payForm.paidAmount),
                        referenceNo: payForm.referenceNo || null,
                        description: `Advance – ${payModal.poNumber} | ${payModal.vendor?.name || ''}`,
                        relatedEntityType: 'PO',
                        relatedEntityId: payModal.id,
                        relatedEntityName: `${payModal.poNumber} | ${payModal.vendor?.name || ''}`,
                    });
                } catch (finErr) {
                    console.warn('Finance debit failed (non-blocking):', finErr.message);
                }
            }
            // 2. Record in inventory (auto-creates bill if absent)
            await payAdvancePO(payModal.id, {
                paidAmount: Number(payForm.paidAmount),
                bankAccountId: payForm.bankAccountId || null,
                bankAccountName: selectedAccount?.accountName || '',
            });
            setPayModal(null);
            await fetchData();
        } catch (e) {
            alert('Failed: ' + (e.response?.data?.message || e.message));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPos = useMemo(() => {
        if (!searchQuery.trim()) return pos;
        const q = searchQuery.toLowerCase();
        return pos.filter(po =>
            (po.poNumber || '').toLowerCase().includes(q) ||
            (po.vendor?.name || po.vendorName || '').toLowerCase().includes(q) ||
            (po.store?.name || '').toLowerCase().includes(q)
        );
    }, [pos, searchQuery]);

    const totalPages = Math.ceil(filteredPos.length / pageSize);
    const paginatedPos = filteredPos.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    useEffect(() => { setPageIndex(0); }, [searchQuery]);

    const selectedPO = useMemo(() => pos.find(p => p.id === selectedPOId) || null, [pos, selectedPOId]);
    const selectedStatus = selectedPO ? (STATUS_MAP[selectedPO.status] || { label: selectedPO.status || '-', color: 'badge-secondary' }) : null;
    const selectedBill = selectedPO ? billsByPoId[selectedPO.id] : null;
    const selectedGrns = selectedPO ? (grnsByPoId[selectedPO.id] || []) : [];

    return (
        <div className="main-content">
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">
                        <ShoppingCart size={26} />
                        Purchase Orders
                    </h1>
                    <p className="page-subtitle">Create and manage purchase orders from suppliers.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    Create Purchase Order
                </button>
            </div>

            {error && (
                <div className="po-error-banner">
                    <AlertCircle size={18} className="po-error-banner-icon" />
                    <div className="po-error-banner-body">
                        <strong>Error</strong>
                        {error}
                    </div>
                    <button className="po-error-retry" onClick={fetchData}>Retry</button>
                </div>
            )}

            <div className="so-layout">
                <div className="table-container so-table-wrap">
                    <div className="table-header">
                        <h3 className="table-title">Purchase Orders ({filteredPos.length})</h3>
                        <div className="po-search">
                            <Search size={14} className="po-search-icon" />
                            <input
                                type="text"
                                placeholder="Search PO, vendor, store..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="po-search-input"
                            />
                            {searchQuery && (
                                <button className="po-search-clear" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>
                    </div>
                    <div className="table-body">
                        {loading ? (
                            <div className="table-empty"><div className="spinner"></div></div>
                        ) : filteredPos.length === 0 ? (
                            <div className="table-empty">{searchQuery ? 'No matching purchase orders.' : 'No purchase orders found.'}</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>PO #</th>
                                        <th>Vendor</th>
                                        {!selectedPOId && <th>Store</th>}
                                        {!selectedPOId && <th>Order Date</th>}
                                        {!selectedPOId && <th>Expected</th>}
                                        {!selectedPOId && <th>Items</th>}
                                        <th>Total</th>
                                        <th>Status</th>
                                        {!selectedPOId && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPos.map(po => {
                                        const s = STATUS_MAP[po.status] || { label: po.status || '-', color: 'badge-secondary' };
                                        const bill = billsByPoId[po.id];
                                        const canPay = bill?.paymentStatus !== 'PAID';
                                        const isSelected = selectedPOId === po.id;
                                        return (
                                            <tr
                                                key={po.id}
                                                className={`so-row${isSelected ? ' so-row-selected' : ''}`}
                                                onClick={() => setSelectedPOId(isSelected ? null : po.id)}
                                            >
                                                <td><strong className="mono">{po.poNumber || po.id}</strong></td>
                                                <td>{po.vendor?.name || po.vendorName || '-'}</td>
                                                {!selectedPOId && <td className="po-store-col">{po.store?.name || '-'}</td>}
                                                {!selectedPOId && <td className="text-muted">{new Date(po.createdAt).toLocaleDateString()}</td>}
                                                {!selectedPOId && <td className="text-muted">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</td>}
                                                {!selectedPOId && <td><span className="po-count-chip">{po.items?.length || 0}</span></td>}
                                                <td>₹{Number(po.totalAmount || 0).toLocaleString()}</td>
                                                <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                                                {!selectedPOId && (
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="po-action-group">
                                                            {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                                                                <button className="btn btn-sm btn-primary" onClick={() => openReceiptModal(po)}>
                                                                    Receive
                                                                </button>
                                                            )}
                                                            {canPay && (
                                                                <button className="btn btn-sm btn-accent" onClick={() => openPayModal(po)}>
                                                                    Pay Advance
                                                                </button>
                                                            )}
                                                            {po.status === 'BILLED' && (
                                                                <span className="text-muted">Billed</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="table-footer">
                        <span className="table-info">
                            Showing {filteredPos.length === 0 ? 0 : pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filteredPos.length)} of {filteredPos.length} purchase orders
                        </span>
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button className="pagination-item" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>← Previous</button>
                                {(() => {
                                    const visible = Math.min(totalPages, 5);
                                    const start = Math.max(0, Math.min(pageIndex - 2, totalPages - visible));
                                    return Array.from({ length: visible }).map((_, i) => {
                                        const page = start + i;
                                        return (
                                            <button key={page} className={`pagination-item ${pageIndex === page ? 'active' : ''}`} onClick={() => setPageIndex(page)}>
                                                {page + 1}
                                            </button>
                                        );
                                    });
                                })()}
                                <button className="pagination-item" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex(pageIndex + 1)}>Next →</button>
                            </div>
                        )}
                    </div>
                </div>

                {selectedPO && (
                    <div className="so-panel">
                        <div className="so-panel-header">
                            <div>
                                <div className="so-panel-name">{selectedPO.poNumber || selectedPO.id}</div>
                                <div className="so-panel-meta">
                                    {selectedPO.vendor?.name || selectedPO.vendorName || '-'}
                                    {selectedPO.store?.name ? ` · ${selectedPO.store.name}` : ''}
                                </div>
                                <div className="so-panel-stats">
                                    <div>
                                        <div className="so-stat-label">Status</div>
                                        <div className="so-stat-value" style={{ fontSize: 13 }}>
                                            <span className={`badge ${selectedStatus.color}`}>{selectedStatus.label}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="so-stat-label">Total</div>
                                        <div className="so-stat-value">₹{Number(selectedPO.totalAmount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="so-stat-label">GRNs</div>
                                        <div className="so-stat-value so-stat-value--incoming">{selectedGrns.length}</div>
                                    </div>
                                </div>
                            </div>
                            <button className="so-panel-close" onClick={() => setSelectedPOId(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="po-detail-body">
                            <div className="po-detail-section">
                                <div className="po-detail-section-title">Ordered Items</div>
                                <table className="table po-detail-items">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th style={{ textAlign: 'center' }}>Ord</th>
                                            <th style={{ textAlign: 'center' }}>Rcvd</th>
                                            <th style={{ textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedPO.items || []).map(it => {
                                            const recv = Number(it.receivedQty || 0);
                                            const ord = Number(it.quantity || 0);
                                            const amt = Number(it.unitPrice || 0) * ord;
                                            return (
                                                <tr key={it.id}>
                                                    <td>{it.inventoryItem?.name || '-'}</td>
                                                    <td style={{ textAlign: 'center' }}>{ord}</td>
                                                    <td style={{ textAlign: 'center', color: recv >= ord ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{recv}</td>
                                                    <td style={{ textAlign: 'right' }}>₹{amt.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="po-detail-section">
                                <div className="po-detail-section-title">Actions</div>
                                <div className="po-detail-actions">
                                    {(selectedPO.status === 'ORDERED' || selectedPO.status === 'PARTIALLY_RECEIVED') && (
                                        <button className="btn btn-sm btn-primary" onClick={() => openReceiptModal(selectedPO)}>Receive Items</button>
                                    )}
                                    {selectedBill?.paymentStatus !== 'PAID' && (
                                        <button className="btn btn-sm btn-accent" onClick={() => openPayModal(selectedPO)}>Pay Advance</button>
                                    )}
                                    {selectedPO.status === 'BILLED' && <span className="text-muted">Already Billed</span>}
                                </div>
                            </div>

                            {selectedBill && (
                                <div className="po-detail-section po-detail-section--bill">
                                    <div className="po-detail-section-title">Linked Bill</div>
                                    <div className="po-detail-card-row">
                                        <div>
                                            <div className="po-detail-card-title">{selectedBill.billNumber || selectedBill.id}</div>
                                            <div className="po-detail-card-sub">
                                                Paid ₹{Number(selectedBill.paidAmount || 0).toLocaleString()} of ₹{Number(selectedBill.totalAmount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={`badge ${selectedBill.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                            {selectedBill.paymentStatus || '-'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="po-detail-section po-detail-section--grn">
                                <div className="po-detail-section-title">Goods Received Notes ({selectedGrns.length})</div>
                                {selectedGrns.length === 0 ? (
                                    <div className="text-muted po-detail-empty">No receipts yet.</div>
                                ) : (
                                    <div className="po-detail-grn-list">
                                        {selectedGrns.map(g => (
                                            <div key={g.id} className="po-detail-card-row">
                                                <div>
                                                    <div className="po-detail-card-title">{g.grnNumber}</div>
                                                    <div className="po-detail-card-sub">
                                                        {g.receivedAt ? new Date(g.receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                                        {` · ${g.items?.length || 0} line${g.items?.length === 1 ? '' : 's'}`}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create PO Modal */}
            {showCreateModal && (
                <div className="modal-overlay active">
                    <div className="modal po-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Create Purchase Order</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label required">Vendor</label>
                                    <SearchableSelect
                                        value={formData.vendorId}
                                        onChange={v => setFormData(f => ({ ...f, vendorId: v }))}
                                        options={vendors}
                                        getId={v => v.id}
                                        getLabel={v => v.name}
                                        placeholder="Select Vendor"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label required">Store</label>
                                    <SearchableSelect
                                        value={formData.storeId}
                                        onChange={v => setFormData(f => ({ ...f, storeId: v }))}
                                        options={activeStores}
                                        getId={s => s.id}
                                        getLabel={s => s.name}
                                        placeholder="Select Store"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Expected Delivery Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.expectedDate}
                                        onChange={e => setFormData(f => ({ ...f, expectedDate: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Line Items</label>
                                    <div className="po-line-items">
                                        {formData.items.map((item, idx) => {
                                            const lineBase = Number(item.quantity) * Number(item.unitPrice);
                                            const lineGst = lineBase * ((Number(item.gstPercent) || 0) / 100);
                                            return (
                                                <div key={idx} className="po-line-item">
                                                    <div style={{ flex: 2 }}>
                                                        <span className="po-line-item-label">Product</span>
                                                        <SearchableSelect
                                                            value={item.itemId}
                                                            onChange={v => {
                                                                const found = items.find(i => i.id === v);
                                                                if (found) handleItemSelect(idx, found);
                                                                else handleItemChange(idx, 'itemId', '');
                                                            }}
                                                            options={items}
                                                            getId={i => i.id}
                                                            getLabel={i => i.name}
                                                            placeholder="Search product..."
                                                            required={!item.itemId}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="po-line-item-label">GST %</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-input"
                                                            value={item.gstPercent}
                                                            onChange={e => handleItemChange(idx, 'gstPercent', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="po-line-item-label">Qty</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="form-input"
                                                            value={item.quantity}
                                                            onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="po-line-item-label">Unit Price (₹)</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="form-input"
                                                            value={item.unitPrice}
                                                            onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger po-remove-btn"
                                                        onClick={() => setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary po-add-item"
                                        onClick={() => setFormData(f => ({ ...f, items: [...f.items, { itemId: '', quantity: 1, unitPrice: 0, gstPercent: 0 }] }))}
                                    >
                                        <Plus size={15} />
                                        Add Item
                                    </button>
                                </div>

                                {(() => {
                                    const total = formData.items.reduce((sum, i) => {
                                        const base = Number(i.quantity) * Number(i.unitPrice);
                                        return sum + base + base * ((Number(i.gstPercent) || 0) / 100);
                                    }, 0);
                                    return (
                                        <div className="po-est-total">
                                            Estimated Total: <strong>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create PO</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Modal */}
            {receiptModal && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '580px', width: '100%' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Receive Items — {receiptModal.poNumber}</h2>
                            <button className="modal-close" onClick={() => setReceiptModal(null)}><X size={18} /></button>
                        </div>
                        {(() => {
                            const hasAssetItems = receiptModal?.items?.some(
                                item => item.inventoryItem?.billingGroup === 'ASSET'
                            );
                            return hasAssetItems ? (
                                <div style={{
                                    background: '#fef3c7',
                                    borderBottom: '1px solid #fcd34d',
                                    padding: '0.75rem 1.25rem',
                                }}>
                                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                        <strong>Asset items in this order</strong><br />
                                        Items routed to the Asset Register will be <strong>automatically registered as assets</strong> upon receipt.
                                    </div>
                                </div>
                            ) : null;
                        })()}
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(receiptModal.items || []).map(item => {
                                const inv = item.inventoryItem;
                                const dest = getDestination(inv);
                                const val = receiptQtys[item.id] || { qty: '', storeId: '', batchNumber: '', expiryDate: '' };
                                const remaining = Number(item.quantity) - Number(item.receivedQty ?? 0);
                                const storeLabel = s => `${s.name}${s.type ? ` (${s.type})` : ''}`;
                                return (
                                    <div key={item.id} style={{ border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        {/* Item header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div>
                                                <strong style={{ fontSize: '0.9375rem' }}>{inv?.name || '-'}</strong>
                                                {inv?.itemTypeName && (
                                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{inv.itemTypeName}</span>
                                                )}
                                            </div>
                                            {dest && (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: dest.color + '18', color: dest.color, whiteSpace: 'nowrap' }}>
                                                    → {dest.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Qty summary */}
                                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary, #64748b)' }}>
                                            <span>Ordered: <strong>{item.quantity}</strong></span>
                                            <span>Received: <strong>{item.receivedQty ?? 0}</strong></span>
                                            <span>Remaining: <strong style={{ color: remaining > 0 ? 'inherit' : '#10b981' }}>{remaining}</strong></span>
                                        </div>

                                        {/* Store selector per item */}
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>
                                                Receive into Store <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <SearchableSelect
                                                value={val.storeId}
                                                onChange={v => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], storeId: v } }))}
                                                options={activeStores}
                                                getId={s => s.id}
                                                getLabel={storeLabel}
                                                placeholder="Select store..."
                                            />
                                        </div>

                                        {/* Inputs */}
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1', minWidth: '80px' }}>
                                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty to Receive</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    step="any"
                                                    className="form-input"
                                                    value={val.qty}
                                                    onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: e.target.value } }))}
                                                    placeholder="0"
                                                />
                                            </div>

                                            {(inv?.batchRequired || inv?.billingGroup === 'PHARMACY') && (
                                                <div style={{ flex: '2', minWidth: '120px' }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Batch No <span style={{ color: '#ef4444' }}>*</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={val.batchNumber}
                                                        onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], batchNumber: e.target.value } }))}
                                                        placeholder="e.g. BT-2024-001"
                                                    />
                                                </div>
                                            )}

                                            {(inv?.expiryRequired || inv?.billingGroup === 'PHARMACY') && (
                                                <div style={{ flex: '2', minWidth: '130px' }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Expiry Date <span style={{ color: '#ef4444' }}>*</span></label>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={val.expiryDate}
                                                        onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], expiryDate: e.target.value } }))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {inv?.billingGroup === 'PHARMACY' && (
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <div style={{ flex: '1', minWidth: '110px' }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>MRP (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        value={val.mrp}
                                                        onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], mrp: e.target.value } }))}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div style={{ flex: '1', minWidth: '110px' }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Selling Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        value={val.sellingPrice}
                                                        onChange={e => setReceiptQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], sellingPrice: e.target.value } }))}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setReceiptModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleReceiptSubmit} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Confirm Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Advance Modal */}
            {payModal && (
                <div className="modal-overlay active">
                    <div className="modal modal-sm">
                        <div className="modal-header">
                            <h2 className="modal-title">Pay Advance — {payModal.poNumber}</h2>
                            <button className="modal-close" onClick={() => setPayModal(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">
                                {payModal.vendor?.name || ''}
                            </p>
                            {(() => {
                                const total = Number(payModal.totalAmount || 0);
                                const paid = Number(payModal.bill?.paidAmount || 0);
                                const remaining = total - paid;
                                return (
                                    <div className="po-pay-summary">
                                        <div className="po-pay-summary-row">
                                            <span>Total</span>
                                            <span>₹{total.toLocaleString()}</span>
                                        </div>
                                        <div className="po-pay-summary-row">
                                            <span>Already Paid</span>
                                            <span>₹{paid.toLocaleString()}</span>
                                        </div>
                                        <div className="po-pay-summary-row po-pay-summary-remaining">
                                            <span>Remaining</span>
                                            <span>₹{remaining.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="form-group">
                                <label className="form-label">Amount Paid (₹) *</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="form-input"
                                    value={payForm.paidAmount}
                                    onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bank Account</label>
                                {bankLoading ? (
                                    <p className="form-help">Loading bank accounts...</p>
                                ) : bankAccounts.length === 0 ? (
                                    <p className="form-help">No bank accounts found. Add one in the Finance app.</p>
                                ) : (
                                    <SearchableSelect
                                        value={payForm.bankAccountId}
                                        onChange={v => setPayForm(f => ({ ...f, bankAccountId: v }))}
                                        options={bankAccounts}
                                        getId={a => a.id}
                                        getLabel={a => `${a.accountName} — ${a.accountType}`}
                                        placeholder="Select Bank Account (optional)"
                                    />
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reference No</label>
                                <input
                                    className="form-input"
                                    value={payForm.referenceNo}
                                    onChange={e => setPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                                    placeholder="Cheque/NEFT/UPI reference"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handlePaySubmit} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
