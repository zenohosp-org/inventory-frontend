import { useState, useEffect, useCallback } from 'react';
import { getStores, createStore, updateStore, deleteStore, getHmsInfrastructure } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { invalidate } from '../../../cache';
import { useToast } from '../../../context/ToastContext';

const EMPTY_STORE_FORM = { name: '', type: 'INVENTORY', isActive: true };

export function useStores() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [formData, setFormData] = useState(EMPTY_STORE_FORM);

    // HMS (block/floor) — only needed on create
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [hmsLoading, setHmsLoading] = useState(false);
    const [hmsError, setHmsError] = useState(false);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getStores();
            let data = response.data || response;
            if (typeof data === 'string') data = JSON.parse(data);
            setStores(Array.isArray(data) ? data : []);
        } catch {
            setStores([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStores(); }, [fetchStores]);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadHms = async () => {
        setHmsLoading(true);
        try {
            const res = await getHmsInfrastructure(user.hospitalId);
            const data = res.data || res;
            setBuildings(Array.isArray(data) ? data : []);
        } catch {
            setHmsError(true);
            setBuildings([]);
        } finally {
            setHmsLoading(false);
        }
    };

    const openCreateModal = async () => {
        setEditingStore(null);
        setFormData(EMPTY_STORE_FORM);
        setSelectedBuilding(null);
        setSelectedFloor(null);
        setHmsError(false);
        setShowModal(true);
        await loadHms();
    };

    const openEditModal = (store) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            type: store.type || 'INVENTORY',
            isActive: store.isActive !== false,
        });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        try {
            if (editingStore) {
                await updateStore(editingStore.id, { name: formData.name, isActive: formData.isActive });
            } else {
                await createStore({
                    name: formData.name,
                    type: formData.type,
                    isActive: formData.isActive,
                    buildingId: selectedBuilding?.id ?? null,
                    buildingName: selectedBuilding?.name ?? null,
                    floorId: selectedFloor?.id ?? null,
                    floorName: selectedFloor?.name ?? null,
                });
            }
            invalidate('stores');
            closeModal();
            fetchStores();
            toast.success(editingStore ? 'Store updated' : 'Store created');
        } catch {
            toast.error('Failed to save store');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        try {
            await deleteStore(id);
            invalidate('stores');
            fetchStores();
            toast.success('Store deleted');
        } catch {
            toast.error('Failed to delete store');
        }
    };

    const floors = selectedBuilding?.floors ?? [];

    const selectBuilding = (id) => {
        const b = buildings.find(b => String(b.id) === String(id)) || null;
        setSelectedBuilding(b);
        setSelectedFloor(null);
    };

    const selectFloor = (id) => {
        const f = floors.find(f => String(f.id) === String(id)) || null;
        setSelectedFloor(f);
    };

    return {
        stores, loading,
        activeDropdown, setActiveDropdown,
        showModal, editingStore, formData,
        buildings, selectedBuilding, selectedFloor, floors,
        hmsLoading, hmsError,
        openCreateModal, openEditModal, closeModal,
        setField, selectBuilding, selectFloor,
        handleSave, handleDelete,
    };
}
