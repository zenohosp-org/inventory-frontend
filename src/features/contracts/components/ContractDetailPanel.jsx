import { X } from 'lucide-react';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtMoney = (n) => (n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—');

const FREQUENCY_LABEL = {
    MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', HALF_YEARLY: 'Half-yearly', YEARLY: 'Yearly',
};

function Row({ label, value }) {
    return (
        <div className="so-row-kv">
            <div className="so-row-kv-title">{label}</div>
            <div>{value ?? '—'}</div>
        </div>
    );
}

export default function ContractDetailPanel({ contract, onClose }) {
    const c = contract;
    return (
        <div className="so-panel">
            <div className="so-panel-header">
                <div>
                    <div className="so-panel-name">{c.asset?.assetName || 'Contract'}</div>
                    <div className="so-panel-meta">
                        {c.contractNumber || '—'}
                        {c.contractType ? ` · ${c.contractType}` : ''}
                    </div>
                    <div className="so-panel-stats">
                        <div>
                            <div className="so-stat-label">Value</div>
                            <div className="so-stat-value">{fmtMoney(c.contractValue)}</div>
                        </div>
                        <div>
                            <div className="so-stat-label">Status</div>
                            <div className="so-stat-value so-stat-value--badge">
                                <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : c.status === 'EXPIRED' ? 'badge-warning' : 'badge-secondary'}`}>
                                    {c.status || '—'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="so-stat-label">Next Service</div>
                            <div className="so-stat-value so-stat-value--date">{fmtDate(c.nextServiceDate)}</div>
                        </div>
                    </div>
                </div>
                <button className="so-panel-close" onClick={onClose} aria-label="Close panel">
                    <X size={16} />
                </button>
            </div>

            <div className="so-txn-scroll">
                <div className="so-txn-heading">Contract</div>
                <Row label="Asset" value={c.asset?.assetName || '—'} />
                <Row label="Contract #" value={c.contractNumber || '—'} />
                <Row label="Type" value={c.contractType || '—'} />
                <Row label="Vendor" value={c.vendor?.name || '—'} />
                <Row label="Value" value={fmtMoney(c.contractValue)} />
                <Row label="Status" value={c.status || '—'} />

                <div className="so-txn-heading">Schedule</div>
                <Row label="Start Date" value={fmtDate(c.startDate)} />
                <Row label="End Date" value={fmtDate(c.endDate)} />
                <Row label="Next Service" value={fmtDate(c.nextServiceDate)} />
                <Row label="Visit Frequency" value={FREQUENCY_LABEL[c.visitFrequency] || c.visitFrequency || '—'} />
                <Row label="Alert Before" value={c.autoAlertDays != null ? `${c.autoAlertDays} days` : '—'} />

                {c.coverageDetails && (
                    <>
                        <div className="so-txn-heading">Coverage</div>
                        <div className="so-txn-row">
                            <div className="so-txn-body">{c.coverageDetails}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
