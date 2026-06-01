import { useState, useEffect, useMemo, useCallback } from 'react';
import { getItems, getCategories, createItem, updateItem, deleteItem, getItemTypes } from '../../../api/client';
import { withCache, invalidate } from '../../../cache';
import { EMPTY_ITEM_FORM, generateItemCode, itemFromExisting } from '../utils/itemHelpers';

const PAGE_SIZE = 20;

export function useInventoryItems() {
    // ── Server data ──
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);

    // ── UI ──
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [pageIndex, setPageIndex] = useState(0);

    // ── Modal ──
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(EMPTY_ITEM_FORM);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, catsRes, typesRes] = await Promise.all([
                withCache('items', getItems),
                withCache('categories', getCategories),
                withCache('itemTypes', getItemTypes),
            ]);
            const parse = (r) => {
                let d = r.data || r;
                if (typeof d === 'string') d = JSON.parse(d);
                return Array.isArray(d) ? d : [];
            };
            setItems(parse(itemsRes));
            setCategories(parse(catsRes));
            setItemTypes(parse(typesRes));
        } catch {
            setItems([]); setCategories([]); setItemTypes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Global click closes the row-action dropdown.
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Derived: filter
    const filteredItems = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return items.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(q) ||
                item.code?.toLowerCase().includes(q);
            const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
    const paginatedItems = useMemo(
        () => filteredItems.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
        [filteredItems, pageIndex]
    );

    // Reset to page 1 when filters change.
    useEffect(() => { setPageIndex(0); }, [searchTerm, selectedCategory]);

    // ── Modal openers ──
    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(EMPTY_ITEM_FORM);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData(itemFromExisting(item));
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData(EMPTY_ITEM_FORM);
    };

    // ── Form field helpers ──
    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            ...(editingItem ? {} : { code: generateItemCode(name, items) }),
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleItemTypeSelect = (type) => {
        setFormData(prev => ({
            ...prev,
            itemTypeId: type.id,
            billable: type.defaultBillable || 'NO',
            consumptionType: type.defaultConsumptionType || 'AUTO_CONSUME',
            batchRequired: type.defaultBatchRequired || false,
            expiryRequired: type.defaultExpiryRequired || false,
            billingGroup: type.defaultBillingGroup || prev.billingGroup,
        }));
    };

    // ── Submit / delete ──
    const handleSubmit = async () => {
        const payload = {
            ...formData,
            packSize: formData.packSize !== '' ? Number(formData.packSize) : null,
            unitsPerStrip: formData.unitsPerStrip !== '' ? Number(formData.unitsPerStrip) : null,
            purchasePrice: formData.purchasePrice !== '' ? Number(formData.purchasePrice) : null,
            sellingPrice: formData.sellingPrice !== '' ? Number(formData.sellingPrice) : null,
            drugReorderQty: formData.drugReorderQty !== '' ? Number(formData.drugReorderQty) : null,
            itemTypeId: formData.itemTypeId || null,
            categoryId: formData.categoryId || null,
        };
        try {
            if (editingItem) {
                await updateItem(editingItem.id, payload);
            } else {
                await createItem({ ...payload, isActive: true });
            }
            invalidate('items');
            closeModal();
            fetchData();
        } catch {
            alert(editingItem ? 'Failed to update product' : 'Failed to create product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await deleteItem(id);
            invalidate('items');
            fetchData();
        } catch {
            alert('Failed to delete product');
        }
    };

    return {
        // data
        items, categories, itemTypes, filteredItems, paginatedItems,
        // ui
        loading,
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        activeDropdown, setActiveDropdown,
        pageIndex, setPageIndex, pageSize: PAGE_SIZE, totalPages,
        // modal
        showModal, editingItem, formData, setFormData,
        openCreateModal, openEditModal, closeModal,
        // form events
        handleNameChange, handleInputChange, handleCheckboxChange, handleItemTypeSelect,
        // actions
        handleSubmit, handleDelete,
        fetchData,
    };
}
