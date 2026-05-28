export const EMPTY_KIT_FORM = {
    name: '',
    code: '',
    description: '',
    patientBillingPrice: '',
    insuranceBillingPrice: '',
    components: [],
};

export const EMPTY_CONSUME_FORM = { storeId: '', quantity: '', force: false };

export function getStatusColor(maxAssemblable) {
    if (maxAssemblable === 0) return '#dc2626';
    if (maxAssemblable <= 2) return '#f59e0b';
    return '#10b981';
}

export function getStatusLabel(maxAssemblable) {
    if (maxAssemblable === 0) return 'Out of Stock';
    if (maxAssemblable <= 2) return 'Low Stock';
    return 'Ready';
}
