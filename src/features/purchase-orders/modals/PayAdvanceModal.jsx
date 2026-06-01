import { X } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import { stripHospitalPrefix } from '../../../utils/format';

export default function PayAdvanceModal({
    po,
    payForm, setPayForm,
    bankAccounts, bankLoading,
    submitting,
    onSubmit, onClose,
}) {
    const total = Number(po.totalAmount || 0);
    const paid = Number(po.bill?.paidAmount || 0);
    const remaining = total - paid;

    return (
        <div className="modal-overlay active">
            <div className="modal modal-sm">
                <div className="modal-header">
                    <h2 className="modal-title">Pay Advance — {stripHospitalPrefix(po.poNumber)}</h2>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <p className="modal-subtitle">{po.vendor?.name || ''}</p>
                    <div className="po-pay-summary">
                        <div className="po-pay-summary-row">
                            <span>Total</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                        <div className="po-pay-summary-row">
                            <span>Already Paid</span>
                            <span>₹{paid.toLocaleString()}</span>
                        </div>
                        <div className="po-pay-summary-row po-pay-summary-remaining">
                            <span>Remaining</span>
                            <span>₹{remaining.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amount Paid (₹) *</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="form-input"
                            value={payForm.paidAmount}
                            onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bank Account</label>
                        {bankLoading ? (
                            <p className="form-help">Loading bank accounts...</p>
                        ) : bankAccounts.length === 0 ? (
                            <p className="form-help">No bank accounts found. Add one in the Finance app.</p>
                        ) : (
                            <SearchableSelect
                                value={payForm.bankAccountId}
                                onChange={v => setPayForm(f => ({ ...f, bankAccountId: v }))}
                                options={bankAccounts}
                                getId={a => a.id}
                                getLabel={a => `${a.accountName} — ${a.accountType}`}
                                placeholder="Select Bank Account (optional)"
                            />
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Reference No</label>
                        <input
                            className="form-input"
                            value={payForm.referenceNo}
                            onChange={e => setPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                            placeholder="Cheque/NEFT/UPI reference"
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
                        {submitting ? 'Saving...' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
