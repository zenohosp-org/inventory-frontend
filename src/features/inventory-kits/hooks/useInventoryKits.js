import { useState, useEffect, useMemo, useCallback } from 'react';
import { getKits, createKit, updateKit, deleteKit, consumeKit, getItems, getStores } from '../../../api/client';
import { EMPTY_KIT_FORM, EMPTY_CONSUME_FORM } from '../utils/kitHelpers';

export function useInventoryKits() {
    // ── Server data ──
    const [kits, setKits] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);

    // ── UI ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Selection / detail panel ──
    const [selectedKit, setSelectedKit] = useState(null);

    // ── Create/Edit modal ──
    const [showModal, setShowModal] = useState(false);
    const [editingKit, setEditingKit] = useState(null);
    const [formData, setFormData] = useState(EMPTY_KIT_FORM);

    // ── Consume modal ──
    const [showConsumeModal, setShowConsumeModal] = useState(false);
    const [consumeForm, setConsumeForm] = useState(EMPTY_CONSUME_FORM);
    const [lowStockWarning, setLowStockWarning] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [kitsRes, itemsRes, storesRes] = await Promise.all([getKits(), getItems(), getStores()]);
            setKits(Array.isArray(kitsRes.data) ? kitsRes.data : []);
            setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
            setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
        } catch (e) {
            setError('Failed to load data. ' + (e.response?.data?.message || e.message));
            setKits([]); setItems([]); setStores([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Close any open row-action dropdown when clicking anywhere else.
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Derived: search filter
    const filteredKits = useMemo(() => {
        if (!searchQuery.trim()) return kits;
        const q = searchQuery.toLowerCase();
        return kits.filter(k =>
            (k.name?.toLowerCase() || '').includes(q) ||
            (k.code?.toLowerCase() || '').includes(q)
        );
    }, [kits, searchQuery]);

    // ── Modal openers ──
    const openCreateModal = () => {
        setEditingKit(null);
        setFormData(EMPTY_KIT_FORM);
        setShowModal(true);
    };

    const openEditModal = (kit) => {
        setEditingKit(kit);
        setFormData({
            name: kit.name || '',
            code: kit.code || '',
            description: kit.description || '',
            patientBillingPrice: kit.patientBillingPrice || '',
            insuranceBillingPrice: kit.insuranceBillingPrice || '',
            components: (kit.components || []).map(c => ({
                itemId: c.item?.id || '',
                itemSearch: c.itemName || c.item?.name || '',
                quantity: c.quantity || '',
            })),
        });
        setShowModal(true);
    };

    const closeFormModal = () => {
        setShowModal(false);
        setEditingKit(null);
        setFormData(EMPTY_KIT_FORM);
    };

    const openConsumeModal = (kit) => {
        setSelectedKit(kit);
        setConsumeForm(EMPTY_CONSUME_FORM);
        setLowStockWarning(null);
        setShowConsumeModal(true);
    };

    // ── Actions ──
    const handleSubmit = async () => {
        if (!formData.name.trim()) { alert('Kit name is required'); return; }
        if (formData.components.length === 0) { alert('Add at least one component'); return; }
        if (formData.components.some(c => !c.itemId || !c.quantity)) {
            alert('All components must have an item and quantity');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code || null,
                description: formData.description || null,
                patientBillingPrice: formData.patientBillingPrice ? Number(formData.patientBillingPrice) : null,
                insuranceBillingPrice: formData.insuranceBillingPrice ? Number(formData.insuranceBillingPrice) : null,
                components: formData.components.map(c => ({
                    itemId: c.itemId,
                    quantity: Number(c.quantity),
                })),
            };

            if (editingKit) {
                await updateKit(editingKit.id, payload);
            } else {
                await createKit(payload);
            }
            closeFormModal();
            await fetchData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (kit) => {
        if (!window.confirm(`Delete kit "${kit.name}"?`)) return;
        try {
            await deleteKit(kit.id);
            await fetchData();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleConsumeSubmit = async () => {
        if (!consumeForm.storeId || !consumeForm.quantity) {
            alert('Select store and enter quantity');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                storeId: consumeForm.storeId,
                quantity: Number(consumeForm.quantity),
                force: consumeForm.force,
            };

            const result = await consumeKit(selectedKit.id, payload);

            if (result.data?.status === 'LOW_STOCK_WARNING') {
                setLowStockWarning(result.data.lowStockItems);
                setConsumeForm(prev => ({ ...prev, force: false }));
            } else if (result.data?.status === 'SUCCESS') {
                setShowConsumeModal(false);
                setSelectedKit(null);
                await fetchData();
            }
        } catch (err) {
            if (err.response?.status === 409) {
                setLowStockWarning(err.response.data?.lowStockItems);
                setConsumeForm(prev => ({ ...prev, force: false }));
            } else {
                alert('Failed: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return {
        // data
        kits, items, stores, filteredKits,
        // ui
        loading, error, submitting,
        searchQuery, setSearchQuery,
        activeDropdown, setActiveDropdown,
        // selection
        selectedKit, setSelectedKit,
        // form modal
        showModal, setShowModal,
        editingKit, formData, setFormData,
        openCreateModal, openEditModal, closeFormModal, handleSubmit,
        // consume modal
        showConsumeModal, setShowConsumeModal,
        consumeForm, setConsumeForm,
        lowStockWarning,
        openConsumeModal, handleConsumeSubmit,
        // actions
        handleDelete,
        fetchData,
    };
}
