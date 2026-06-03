import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getPurchaseOrders, createPurchaseOrder,
    getVendors, getItems, getStores,
    recordPOReceipt,
    payAdvancePO, getFinanceBankAccounts, createFinanceBankTransaction,
    getPOBills, getGrns,
    createAsset, getAssets, logStock,
    getAssetSyncLogs, retryAssetSync,
} from '../../../api/client';
import { query, invalidateKey } from '../../../lib/queryCache';
import { EMPTY_PO_FORM, EMPTY_PAY_FORM, extractArray } from '../utils/poHelpers';
import { useToast } from '../../../context/ToastContext';

export function usePurchaseOrders(user) {
    const { toast } = useToast();
    // ── Server data ──
    const [pos, setPos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [activeStores, setActiveStores] = useState([]);
    const [billsByPoId, setBillsByPoId] = useState({});
    const [grnsByPoId, setGrnsByPoId] = useState({});
    const [syncLogByPoId, setSyncLogByPoId] = useState({});
    const [bankAccounts, setBankAccounts] = useState([]);

    // ── UI state ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPOId, setSelectedPOId] = useState(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const pageSize = 20;

    // ── Modals ──
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState(EMPTY_PO_FORM);
    const [receiptModal, setReceiptModal] = useState(null);
    const [receiptQtys, setReceiptQtys] = useState({});
    const [payModal, setPayModal] = useState(null);
    const [payForm, setPayForm] = useState(EMPTY_PAY_FORM);
    const [bankLoading, setBankLoading] = useState(false);

    // Aggregator helpers — turn flat lists into the lookup maps the UI consumes.
    const applyBills = useCallback((billsRes) => {
        const map = {};
        extractArray(billsRes).forEach(b => {
            const poId = b.purchaseOrder?.id;
            if (poId) map[poId] = b;
        });
        setBillsByPoId(map);
    }, []);

    const applyGrns = useCallback((grnsRes) => {
        const map = {};
        extractArray(grnsRes).forEach(g => {
            const poId = g.purchaseOrder?.id;
            if (!poId) return;
            if (!map[poId]) map[poId] = [];
            map[poId].push(g);
        });
        setGrnsByPoId(map);
    }, []);

    const applySyncLogs = useCallback((res) => {
        const map = {};
        const logs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        logs.forEach(l => { if (l.poId) map[l.poId] = l; });
        setSyncLogByPoId(map);
    }, []);

    const fetchData = useCallback(async () => {
        setError(null);

        // SWR pattern: pull whatever the shared cache already has and render it now.
        // Only show the loading spinner if EVERY slice is cold — otherwise the user
        // sees data immediately while fresh copies stream in in the background.
        const slices = [
            { key: 'purchaseOrders', fetcher: getPurchaseOrders,   apply: r => setPos(extractArray(r)) },
            { key: 'vendors',        fetcher: getVendors,           apply: r => setVendors(extractArray(r)) },
            { key: 'items',          fetcher: getItems,             apply: r => setItems(extractArray(r)) },
            { key: 'stores',         fetcher: getStores,            apply: r => setActiveStores(extractArray(r).filter(s => s?.isActive)) },
            { key: 'poBills',        fetcher: getPOBills,           apply: applyBills },
            { key: 'grns',           fetcher: getGrns,             apply: applyGrns },
            { key: 'assetSyncLogs',  fetcher: getAssetSyncLogs,    apply: applySyncLogs },
        ];

        const queries = slices.map(s => {
            const result = query(s.key, s.fetcher);
            if (result.data !== undefined) s.apply(result.data);  // hydrate from cache synchronously
            return { ...s, result };
        });

        const anyCold = queries.some(q => q.result.data === undefined);
        if (anyCold) setLoading(true);

        try {
            const fresh = await Promise.all(queries.map(q => q.result.fresh));
            queries.forEach((q, i) => q.apply(fresh[i]));
        } catch (e) {
            setError('Failed to load data. ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    }, [applyBills, applyGrns]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Derived data (memoized — only recompute when inputs change) ──
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
    const paginatedPos = useMemo(
        () => filteredPos.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        [filteredPos, pageIndex]
    );

    const selectedPO = useMemo(
        () => pos.find(p => p.id === selectedPOId) || null,
        [pos, selectedPOId]
    );
    const selectedBill = selectedPO ? billsByPoId[selectedPO.id] : null;
    const selectedGrns = selectedPO ? (grnsByPoId[selectedPO.id] || []) : [];

    // Reset to page 1 whenever the filter changes.
    useEffect(() => { setPageIndex(0); }, [searchQuery]);

    // ── Actions ──
    const handleCreate = async () => {
        const validItems = formData.items.filter(i => i.itemId && i.quantity > 0);
        if (!formData.vendorId) { toast.warn('Please select a vendor'); return; }
        if (!formData.storeId) { toast.warn('Please select a store'); return; }
        if (validItems.length === 0) { toast.warn('Please add at least one item'); return; }
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
            setFormData(EMPTY_PO_FORM);
            invalidateKey('purchaseOrders'); invalidateKey('poBills'); invalidateKey('grns');
            await fetchData();
            toast.success('Purchase order created');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to create purchase order');
        }
    };

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
            toast.warn('Missing required fields: ' + missingFields.join(', '));
            return;
        }

        setSubmitting(true);
        try {
            await recordPOReceipt(receiptModal.id, items);

            const hasAssetItems = receiptModal?.items?.some(
                item => item.inventoryItem?.billingGroup === 'ASSET'
            );

            if (hasAssetItems) {
                const assetsRes = await getAssets(user?.token);
                const existingAssets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
                const generatedCodes = new Set();

                for (const item of items) {
                    const poItem = receiptModal.items.find(i => i.id === item.poItemId);
                    const inv = poItem?.inventoryItem;
                    if (inv?.billingGroup !== 'ASSET') continue;

                    const prefix = (inv.name || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
                    const existingForPrefix = existingAssets.filter(a => a.assetCode?.startsWith(prefix + '-'));
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
            invalidateKey('purchaseOrders'); invalidateKey('poBills'); invalidateKey('grns'); invalidateKey('assetSyncLogs');
            await fetchData();
            toast.success('Receipt recorded successfully');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to record receipt');
        } finally {
            setSubmitting(false);
        }
    };

    const retrySync = async (poId) => {
        try {
            const res = await retryAssetSync(poId);
            const log = res?.data;
            if (log) {
                setSyncLogByPoId(prev => ({ ...prev, [poId]: log }));
            }
            toast.success('Asset sync retried successfully');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Retry failed');
        }
    };

    const openPayModal = async (po) => {
        setPayModal({ ...po, bill: billsByPoId[po.id] || null });
        setPayForm(EMPTY_PAY_FORM);
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
            toast.warn('Enter a valid payment amount'); return;
        }
        setSubmitting(true);
        const selectedAccount = bankAccounts.find(a => a.id === payForm.bankAccountId);
        try {
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
            await payAdvancePO(payModal.id, {
                paidAmount: Number(payForm.paidAmount),
                bankAccountId: payForm.bankAccountId || null,
                bankAccountName: selectedAccount?.accountName || '',
            });
            setPayModal(null);
            invalidateKey('purchaseOrders'); invalidateKey('poBills'); invalidateKey('grns');
            await fetchData();
            toast.success('Payment recorded');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        // data
        pos, vendors, items, activeStores, billsByPoId, grnsByPoId, syncLogByPoId, bankAccounts,
        // derived
        filteredPos, paginatedPos, totalPages, selectedPO, selectedBill, selectedGrns,
        // ui state
        loading, error, submitting, bankLoading,
        searchQuery, setSearchQuery,
        selectedPOId, setSelectedPOId,
        pageIndex, setPageIndex, pageSize,
        // create modal
        showCreateModal, setShowCreateModal,
        formData, setFormData,
        handleCreate,
        // receipt modal
        receiptModal, setReceiptModal,
        receiptQtys, setReceiptQtys,
        openReceiptModal, handleReceiptSubmit,
        // pay modal
        payModal, setPayModal,
        payForm, setPayForm,
        openPayModal, handlePaySubmit,
        // misc
        fetchData, retrySync,
    };
}
