export const GST_OPTIONS = [0, 5, 12, 18, 28];

export const UNIT_OPTIONS = [
    { value: 'Piece', label: 'Piece (pcs)' },
    { value: 'Box', label: 'Box' },
    { value: 'Roll', label: 'Roll' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litre', label: 'Litre (ml)' },
    { value: 'Pack', label: 'Pack' },
];

export const DRUG_SCHEDULE_OPTIONS = [
    { value: '', label: '— Select —' },
    { value: 'OTC', label: 'OTC (Over the Counter)' },
    { value: 'H', label: 'H (Prescription)' },
    { value: 'H1', label: 'H1 (Narcotic/Psychotropic)' },
    { value: 'X', label: 'X (Controlled)' },
];

export const TRACKING_FLAGS = [
    ['batchRequired', 'Batch Required'],
    ['expiryRequired', 'Expiry Required'],
    ['serialRequired', 'Serial Required'],
];

export const EMPTY_ITEM_FORM = {
    name: '',
    code: '',
    description: '',
    categoryId: '',
    unit: 'Piece',
    packSize: '',
    unitsPerStrip: '',
    reorderLevel: 5,
    gstPercent: 0,
    itemTypeId: '',
    purchasePrice: '',
    sellingPrice: '',
    billable: 'NO',
    billingGroup: '',
    consumptionType: 'AUTO_CONSUME',
    batchRequired: false,
    expiryRequired: false,
    serialRequired: false,
    genericName: '',
    hsnCode: '',
    drugSchedule: '',
    drugReorderQty: '',
};

export function generateItemCode(name, items) {
    const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    if (!prefix) return '';
    const count = items.filter(i => i.code?.startsWith(prefix + '-')).length;
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export function itemFromExisting(item) {
    return {
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        unit: item.unit || 'Piece',
        packSize: item.packSize ?? '',
        unitsPerStrip: item.unitsPerStrip ?? '',
        reorderLevel: item.reorderLevel ?? 5,
        gstPercent: item.gstPercent ?? 0,
        itemTypeId: item.itemTypeId || '',
        purchasePrice: item.purchasePrice ?? '',
        sellingPrice: item.sellingPrice ?? '',
        billable: item.billable || 'NO',
        billingGroup: item.billingGroup || '',
        consumptionType: item.consumptionType || 'AUTO_CONSUME',
        batchRequired: item.batchRequired || false,
        expiryRequired: item.expiryRequired || false,
        serialRequired: item.serialRequired || false,
        genericName: item.genericName || '',
        hsnCode: item.hsnCode || '',
        drugSchedule: item.drugSchedule || '',
        drugReorderQty: item.drugReorderQty ?? '',
    };
}
