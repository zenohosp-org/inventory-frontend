import { useState, useMemo } from 'react';
import { ArrowLeft, Printer, Search } from 'lucide-react';
import { getDeliveryChallans, getPurchaseReturnById } from '../api/client';
import { useQuery } from '../hooks/useQuery';
import PageHeader from '../components/PageHeader';

export default function DeliveryChallans() {
    const { data: rawData, loading, refetch } = useQuery('deliveryChallans', getDeliveryChallans);
    const challans = useMemo(() => Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []), [rawData]);

    const [view, setView] = useState('list'); // 'list', 'print'
    const [activeChallan, setActiveChallan] = useState(null);
    const [activeReturn, setActiveReturn] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const handleView = async (challan) => {
        try {
            setIsLoadingDetails(true);
            const res = await getPurchaseReturnById(challan.referenceId);
            setActiveReturn(res.data);
            setActiveChallan(challan);
            setView('print');
        } catch (err) {
            console.error("Error fetching return details:", err);
            alert("Failed to load challan details.");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const fmt = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
               d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const renderList = () => (
        <div className="zu-page-content">
            {isLoadingDetails && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div>Loading...</div>
                </div>
            )}
            <div className="card">
                <div className="card-body">
                    <table className="zu-table">
                        <thead>
                            <tr>
                                <th>Challan No</th>
                                <th>Date</th>
                                <th>Consignee</th>
                                <th>Transporter</th>
                                <th>Vehicle No</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {challans.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-muted">No delivery challans found.</td></tr>
                            ) : challans.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.challanNumber}</strong></td>
                                    <td>{fmt(c.createdAt)}</td>
                                    <td>{c.recipientName || '-'}</td>
                                    <td>{c.transporterName || 'Pending'}</td>
                                    <td>{c.vehicleNumber || 'Pending'}</td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleView(c)}>View & Print</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPrintView = () => {
        if (!activeChallan || !activeReturn) return null;

        const dc = activeChallan;
        const dn = activeReturn.debitNote;
        const vendor = activeReturn.grn?.purchaseOrder?.vendor || { name: dc.recipientName, address: dc.recipientAddress };

        return (
            <div className="zu-page-content">
                <div className="filter-bar no-print">
                    <button className="btn btn-ghost" onClick={() => { setView('list'); refetch(); }}>
                        <ArrowLeft size={16} /> Back to List
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Challan
                    </button>
                </div>

                <div className="print-area" style={{ background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2>DELIVERY CHALLAN</h2>
                        <h4 className="text-muted">Transport Document</h4>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <strong>Consignee (To):</strong><br/>
                            {vendor.name}<br/>
                            {vendor.address && <>{vendor.address}<br/></>}
                            <strong>GSTIN:</strong> {dn?.vendorGstin || 'Unregistered'}<br/>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <strong>Challan No:</strong> {dc.challanNumber}<br/>
                            <strong>Date:</strong> {fmt(dc.createdAt)}<br/>
                            {dn && <><strong>Ref Debit Note:</strong> {dn.debitNoteNumber}<br/></>}
                            <strong>Hospital GSTIN:</strong> {dn?.hospitalGstin || 'Unregistered'}
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                        <h6 style={{ margin: 0, marginBottom: '8px' }}>Logistics Details</h6>
                        <p style={{ margin: 0 }}><strong>Transporter:</strong> {dc.transporterName || 'Pending'}</p>
                        <p style={{ margin: 0 }}><strong>Vehicle No:</strong> {dc.vehicleNumber || 'Pending'}</p>
                    </div>

                    <table className="zu-table" style={{ width: '100%', marginBottom: '2rem' }}>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Batch / HSN</th>
                                <th style={{ textAlign: 'right' }}>Qty to Dispatch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeReturn.items?.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.inventoryItem?.name}</strong><br/>
                                        <small className="text-muted">Reason: {item.reason} {item.remarks ? `(${item.remarks})` : ''}</small>
                                    </td>
                                    <td>
                                        {item.batchNumber || '-'}<br/>
                                        <small className="text-muted">HSN: {item.hsnCode || '-'}</small>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <strong>{item.returnQty}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                        <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '8px' }}>
                            Authorized Signatory
                        </div>
                        <div style={{ borderTop: '1px solid black', width: '200px', textAlign: 'center', paddingTop: '8px' }}>
                            Receiver's Signature
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <PageHeader 
                title="Delivery Challans" 
                subtitle={view === 'list' ? "Manage all dispatch and transport documents" : `Viewing ${activeChallan?.challanNumber}`}
            />
            {view === 'list' && renderList()}
            {view === 'print' && renderPrintView()}
        </div>
    );
}
