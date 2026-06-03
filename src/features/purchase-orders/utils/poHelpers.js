export const STATUS_MAP = {
    ORDERED: { label: 'Ordered', color: 'badge-primary' },
    PARTIALLY_RECEIVED: { label: 'Partial', color: 'badge-warning' },
    RECEIVED: { label: 'Received', color: 'badge-success' },
    BILLED: { label: 'Billed', color: 'badge-secondary' },
};

export const EMPTY_PO_FORM = {
    vendorId: '',
    storeId: '',
    expectedDate: '',
    items: [{ itemId: '', quantity: 1, unitPrice: 0, gstPercent: 0 }],
};

export const EMPTY_PAY_FORM = { paidAmount: '', bankAccountId: '', referenceNo: '' };

export function extractArray(res) {
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    try { const p = JSON.parse(data); return Array.isArray(p) ? p : []; } catch { return []; }
}

export function getDestination(inv) {
    if (!inv) return null;
    if (inv.billingGroup === 'ASSET')    return { label: 'Asset Register',     mod: 'asset' };
    if (inv.billingGroup === 'PHARMACY') return { label: 'Pharmacy Stock',     mod: 'pharmacy' };
    if (inv.billingGroup === 'OT')       return { label: 'OT Stock',           mod: 'ot' };
    if (inv.billingGroup === 'ROOM')     return { label: 'Room / Ward Stock',  mod: 'room' };
    return { label: 'Main Inventory', mod: 'default' };
}
