import { useState, useEffect, useCallback } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../../api/client';
import { withCache, invalidate } from '../../../cache';
import { EMPTY_VENDOR_FORM, vendorFromExisting, deriveStateFromGst } from '../utils/vendorHelpers';
import { useToast } from '../../../context/ToastContext';

export function useVendors() {
    const { toast } = useToast();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_VENDOR_FORM);
    const [stateAutoFilled, setStateAutoFilled] = useState(false);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await withCache('vendors', getVendors);
            let data = res.data || res;
            if (typeof data === 'string') data = JSON.parse(data);
            setVendors(Array.isArray(data) ? data : []);
        } catch {
            setVendors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVendors(); }, [fetchVendors]);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(EMPTY_VENDOR_FORM);
        setStateAutoFilled(false);
        setShowModal(true);
    };

    const openEditModal = (vendor) => {
        setEditingId(vendor.id);
        setFormData(vendorFromExisting(vendor));
        setStateAutoFilled(false);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    // Field setter — returns a curried handler so the form JSX stays clean.
    const setField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleGstChange = (e) => {
        const gst = e.target.value.toUpperCase();
        const derivedState = deriveStateFromGst(gst);
        setFormData(prev => ({
            ...prev,
            gstNumber: gst,
            ...(derivedState ? { state: derivedState } : {}),
        }));
        setStateAutoFilled(!!derivedState);
    };

    const setActive = (checked) => setFormData(prev => ({ ...prev, isActive: checked }));

    const handleSave = async () => {
        if (formData.gstNumber) {
            const duplicate = vendors.find(v => v.gstNumber === formData.gstNumber && v.id !== editingId);
            if (duplicate) {
                toast.warn(`GST number is already used by "${duplicate.name}"`);
                return;
            }
        }
        try {
            if (editingId) {
                await updateVendor(editingId, formData);
                toast.success('Vendor updated successfully');
            } else {
                await createVendor(formData);
                toast.success('Vendor created successfully');
            }
            invalidate('vendors');
            closeModal();
            fetchVendors();
        } catch {
            toast.error('Failed to save vendor');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this vendor?')) return;
        try {
            await deleteVendor(id);
            invalidate('vendors');
            fetchVendors();
            toast.success('Vendor deleted');
        } catch {
            toast.error('Failed to delete vendor');
        }
    };

    return {
        vendors, loading,
        activeDropdown, setActiveDropdown,
        showModal, editingId, formData, stateAutoFilled,
        openCreateModal, openEditModal, closeModal,
        setField, handleGstChange, setActive,
        handleSave, handleDelete,
    };
}
