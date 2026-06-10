export const CONTRACT_TYPES = [
    { value: 'AMC', label: 'AMC — Annual Maintenance' },
    { value: 'CMC', label: 'CMC — Comprehensive Maintenance' },
];

export const VISIT_FREQUENCIES = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'HALF_YEARLY', label: 'Half-yearly' },
    { value: 'YEARLY', label: 'Yearly' },
];

export const EMPTY_CONTRACT_FORM = {
    assetId: '', vendorId: '',
    contractType: 'AMC', contractNumber: '',
    startDate: '', endDate: '',
    contractValue: '', coverageDetails: '',
    visitFrequency: 'QUARTERLY', autoAlertDays: 30,
};

// Map an existing contract (nested asset/vendor objects from the asset API)
// back into the flat form shape used by the modal.
export function contractFromExisting(c) {
    return {
        assetId: c.asset?.assetId || '',
        vendorId: c.vendor?.id || '',
        contractType: c.contractType || 'AMC',
        contractNumber: c.contractNumber || '',
        startDate: c.startDate || '',
        endDate: c.endDate || '',
        contractValue: c.contractValue != null ? String(c.contractValue) : '',
        coverageDetails: c.coverageDetails || '',
        visitFrequency: c.visitFrequency || 'QUARTERLY',
        autoAlertDays: c.autoAlertDays != null ? c.autoAlertDays : 30,
    };
}

// Build the JSON body the asset /api/amc create/update/renew endpoints expect.
export function formToPayload(form) {
    return {
        asset: { assetId: form.assetId },
        vendor: { id: form.vendorId },
        contractType: form.contractType,
        contractNumber: form.contractNumber || null,
        startDate: form.startDate,
        endDate: form.endDate,
        contractValue: form.contractValue ? parseFloat(form.contractValue) : null,
        coverageDetails: form.coverageDetails || null,
        visitFrequency: form.visitFrequency,
        autoAlertDays: form.autoAlertDays ? parseInt(form.autoAlertDays, 10) : 30,
    };
}
