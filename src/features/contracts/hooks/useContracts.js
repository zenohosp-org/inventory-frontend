import { useState, useEffect, useCallback } from 'react';
import {
    getContracts, createContract, updateContract, renewContract, cancelContract,
    getAssetList, getAssetVendors,
} from '../../../api/client';
import { EMPTY_CONTRACT_FORM, contractFromExisting, formToPayload } from '../utils/contractHelpers';
import { useToast } from '../../../context/ToastContext';

export function useContracts() {
    const { toast } = useToast();
    const [contracts, setContracts] = useState([]);
    const [assets, setAssets] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Modal — mode is 'create' | 'edit' | 'renew'
    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_CONTRACT_FORM);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, aRes, vRes] = await Promise.all([
                getContracts(), getAssetList(), getAssetVendors(),
            ]);
            setContracts(Array.isArray(cRes.data) ? cRes.data : []);
            setAssets(Array.isArray(aRes.data) ? aRes.data : []);
            setVendors(Array.isArray(vRes.data) ? vRes.data : []);
        } catch {
            setContracts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const openCreateModal = () => {
        setMode('create');
        setEditingId(null);
        setFormData(EMPTY_CONTRACT_FORM);
        setShowModal(true);
    };

    const openEditModal = (contract) => {
        setMode('edit');
        setEditingId(contract.id);
        setFormData(contractFromExisting(contract));
        setShowModal(true);
    };

    const openRenewModal = (contract) => {
        setMode('renew');
        setEditingId(contract.id);
        setFormData(contractFromExisting(contract));
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    // Curried setter for plain inputs/selects; setSelect for SearchableSelect.
    const setField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
    const setSelect = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        const payload = formToPayload(formData);
        setSaving(true);
        try {
            if (mode === 'edit') {
                await updateContract(editingId, payload);
                toast.success('Contract updated successfully');
            } else if (mode === 'renew') {
                await renewContract(editingId, payload);
                toast.success('Contract renewed successfully');
            } else {
                await createContract(payload);
                toast.success('Contract created successfully');
            }
            closeModal();
            fetchData();
        } catch {
            toast.error('Failed to save contract');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (contract) => {
        if (!window.confirm(`Cancel contract for "${contract.asset?.assetName || 'this asset'}"?`)) return;
        try {
            await cancelContract(contract.id);
            toast.success('Contract cancelled');
            fetchData();
        } catch {
            toast.error('Failed to cancel contract');
        }
    };

    return {
        contracts, assets, vendors, loading,
        activeDropdown, setActiveDropdown,
        showModal, mode, editingId, formData, saving,
        openCreateModal, openEditModal, openRenewModal, closeModal,
        setField, setSelect,
        handleSave, handleCancel,
    };
}
