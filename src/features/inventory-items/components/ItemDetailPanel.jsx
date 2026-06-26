import { X } from 'lucide-react';
import { stripHospitalPrefix } from '../../../utils/format';

const BILLABLE_LABEL = { YES: 'Yes', NO: 'No', CONDITIONAL: 'Conditional' };

function Row({ label, value }) {
    return (
        <div className="so-row-kv">
            <div className="so-row-kv-title">{label}</div>
            <div>{value ?? '—'}</div>
        </div>
    );
}

export default function ItemDetailPanel({ item, categories, onClose }) {
    const categoryName = categories.find(c => c.id === item.categoryId)?.name || '—';
    const isPharmacy = item.billingGroup === 'PHARMACY';
    const yesNo = (v) => (v ? 'Yes' : 'No');
    const price = (v) => (v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '—');

    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div className="so-panel-name">{item.name}</div>
                    <div className="so-panel-meta">
                        {stripHospitalPrefix(item.code) || '—'}
                        {item.itemTypeName ? ` · ${item.itemTypeName}` : ''}
                    </div>
                    <div className="so-panel-stats">
                        <div>
                            <div className="so-stat-label">Purchase</div>
                            <div className="so-stat-value">{price(item.purchasePrice)}</div>
                        </div>
                        <div>
                            <div className="so-stat-label">Selling</div>
                            <div className="so-stat-value">{price(item.sellingPrice)}</div>
                        </div>
                        <div>
                            <div className="so-stat-label">Min Level</div>
                            <div className="so-stat-value">{item.reorderLevel ?? '—'}</div>
                        </div>
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose} aria-label="Close panel">
                    <X size={16} />
                </button>
            </div>

            <div className="so-txn-scroll">
                <div className="so-txn-heading">Details</div>
                <Row label="Code" value={stripHospitalPrefix(item.code) || '—'} />
                <Row label="Category" value={categoryName} />
                <Row label="Item Type" value={item.itemTypeName || '—'} />
                <Row label="Unit" value={item.unit || '—'} />
                <Row label="Pack Size" value={item.packSize ?? '—'} />
                <Row label="GST %" value={item.gstPercent != null ? `${item.gstPercent}%` : '—'} />
                <Row label="Billable" value={BILLABLE_LABEL[item.billable] || '—'} />
                <Row label="Billing Group" value={item.billingGroup || '—'} />
                <Row label="Consumption" value={item.consumptionType || '—'} />

                <div className="so-txn-heading">Tracking</div>
                <Row label="Batch Required" value={yesNo(item.batchRequired)} />
                <Row label="Expiry Required" value={yesNo(item.expiryRequired)} />

                {isPharmacy && (
                    <>
                        <div className="so-txn-heading">Pharmacy</div>
                        <Row label="Generic Name" value={item.genericName || '—'} />
                        <Row label="HSN Code" value={item.hsnCode || '—'} />
                        <Row label="Drug Schedule" value={item.drugSchedule || '—'} />
                        <Row label="Units / Strip" value={item.unitsPerStrip ?? '—'} />
                    </>
                )}

                {item.description && (
                    <>
                        <div className="so-txn-heading">Description</div>
                        <div className="so-txn-row">
                            <div className="so-txn-body">{item.description}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
