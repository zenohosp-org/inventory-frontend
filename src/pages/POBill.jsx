import { useState, useEffect } from 'react';
import { Receipt, X } from 'lucide-react';
import { getPOBills, updatePOBillPaymentStatus } from '../api/client';

const STATUS_BADGE = {
    PENDING: 'badge-error',
    PARTIAL: 'badge-warning',
    PAID: 'badge-success',
};

function StatusBadge({ status }) {
    return <span className={`badge ${STATUS_BADGE[status] || 'badge-secondary'}`}>{status || '-'}</span>;
}

export default function POBill() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingBill, setEditingBill] = useState(null);
    const [payForm, setPayForm] = useState({ paymentStatus: '', paidAmount: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setLoading(true);
        try {
            const res = await getPOBills();
            setBills(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setBills([]);
        } finally {
            setLoading(false);
        }
    };

    const openPayModal = (bill) => {
        setPayForm({ paymentStatus: bill.paymentStatus || 'PENDING', paidAmount: bill.paidAmount ?? '' });
        setEditingBill(bill);
    };

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updatePOBillPaymentStatus(editingBill.id, payForm.paymentStatus, Number(payForm.paidAmount));
            setEditingBill(null);
            await loadBills();
        } catch (err) {
            alert('Failed to update: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Receipt size={24} /> PO Bills</h1>
                    <p className="page-subtitle">Track purchase order invoices and payment status.</p>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h3 className="table-title">Bills ({bills.length})</h3>
                </div>
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : bills.length === 0 ? (
                        <div className="table-empty">No bills yet. Convert a received PO to create a bill.</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Bill #</th>
                                    <th>PO #</th>
                                    <th>Vendor</th>
                                    <th>Store</th>
                                    <th>Bill Date</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => {
                                    const total = Number(bill.totalAmount || 0);
                                    const paid = Number(bill.paidAmount || 0);
                                    return (
                                        <tr key={bill.id}>
                                            <td><strong className="mono">{bill.billNumber}</strong></td>
                                            <td className="mono text-muted">{bill.poNumber || bill.purchaseOrder?.poNumber || '-'}</td>
                                            <td>{bill.vendorName || bill.purchaseOrder?.vendor?.name || '-'}</td>
                                            <td className="text-muted">{bill.storeName || '-'}</td>
                                            <td className="text-muted">
                                                {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>₹{total.toLocaleString()}</td>
                                            <td>₹{paid.toLocaleString()}</td>
                                            <td><strong className={total - paid > 0 ? 'text-danger' : ''}>₹{(total - paid).toLocaleString()}</strong></td>
                                            <td><StatusBadge status={bill.paymentStatus} /></td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => openPayModal(bill)}>
                                                    Update Payment
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {editingBill && (
                <div className="modal-overlay active">
                    <div className="modal" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Update Payment — {editingBill.billNumber}</h2>
                            <button className="modal-close" onClick={() => setEditingBill(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handlePaySubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <select
                                        className="form-select"
                                        value={payForm.paymentStatus}
                                        onChange={e => setPayForm(f => ({ ...f, paymentStatus: e.target.value }))}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PARTIAL">Partial</option>
                                        <option value="PAID">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Paid Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-input"
                                        value={payForm.paidAmount}
                                        onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))}
                                        required
                                    />
                                    <span className="form-hint">
                                        Total: ₹{Number(editingBill.totalAmount || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingBill(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
