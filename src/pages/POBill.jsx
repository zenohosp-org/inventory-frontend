import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { getPOBills } from '../api/client';
import { useQuery } from '../hooks/useQuery';
import { stripHospitalPrefix } from '../utils/format';
import PageHeader from '../components/PageHeader';

const STATUS_BADGE = {
    PENDING: 'badge-error',
    PARTIAL: 'badge-warning',
    PAID: 'badge-success',
};

function StatusBadge({ status }) {
    return <span className={`badge ${STATUS_BADGE[status] || 'badge-secondary'}`}>{status || '-'}</span>;
}
export default function POBill() {
    const { data: poBillsRaw, loading } = useQuery('poBills', getPOBills);

    const bills = useMemo(() => {
        const data = Array.isArray(poBillsRaw?.data) ? [...poBillsRaw.data] : [];
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return data;
    }, [poBillsRaw]);

    return (
        <div>
            <PageHeader 
                title={
                    <>
                        <Receipt size={24} /> PO Bills
                    </>
                }
                subtitle='Purchase order payment summary. Use "Pay Advance" on a PO to record payments.'
            />

            <div className="zu-table-wrapper">
                <div className="table-body">
                    {loading ? (
                        <div className="table-empty"><div className="spinner"></div></div>
                    ) : bills.length === 0 ? (
                        <div className="table-empty">No bills yet. Use "Pay Advance" on a PO to create one.</div>
                    ) : (
                        <table className="zu-table">
                            <thead>
                                <tr>
                                    <th>Bill #</th>
                                    <th>PO #</th>
                                    <th>Vendor</th>
                                    <th>Store</th>
                                    <th>Bill Date</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Bank Account</th>
                                    <th>Due</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => {
                                    const total = Number(bill.totalAmount || 0);
                                    const paid = Number(bill.paidAmount || 0);
                                    return (
                                        <tr key={bill.id}>
                                            <td><strong className="mono">{stripHospitalPrefix(bill.billNumber)}</strong></td>
                                            <td className="mono text-muted">{stripHospitalPrefix(bill.poNumber || bill.purchaseOrder?.poNumber) || '—'}</td>
                                            <td>{bill.vendorName || bill.purchaseOrder?.vendor?.name || '—'}</td>
                                            <td className="text-muted">{bill.storeName || '—'}</td>
                                            <td className="text-muted">
                                                {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td>₹{total.toLocaleString()}</td>
                                            <td>₹{paid.toLocaleString()}</td>
                                            <td className="text-muted">{bill.bankAccountName || '—'}</td>
                                            <td><strong className={total - paid > 0 ? 'text-danger' : ''}>₹{(total - paid).toLocaleString()}</strong></td>
                                            <td><StatusBadge status={bill.paymentStatus} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
