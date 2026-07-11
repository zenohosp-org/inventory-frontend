import { useState, useMemo } from 'react';
import { ArrowLeft, Package, Plus, Search, CheckCircle, Save, Trash2, Printer, Loader2 } from 'lucide-react';
import { 
    getPurchaseReturns, 
    createDraftPurchaseReturn, 
    savePurchaseReturnItems, 
    confirmPurchaseReturn, 
    deleteDraftPurchaseReturn, 
    getGrns,
    getDeliveryChallan
} from '../api/client';
import { useQuery } from '../hooks/useQuery';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { stripHospitalPrefix } from '../utils/format';

const REASONS = ['DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'QUALITY_REJECTED', 'EXCESS_SUPPLY', 'OTHER'];

export default function PurchaseReturns() {
    const { data: returnsRaw, loading, refetch } = useQuery('purchaseReturns', getPurchaseReturns);
    const returns = useMemo(() => Array.isArray(returnsRaw?.data) ? returnsRaw.data : (Array.isArray(returnsRaw) ? returnsRaw : []), [returnsRaw]);

    const { data: grnsRaw } = useQuery('grns', getGrns);
    const grns = useMemo(() => Array.isArray(grnsRaw?.data) ? grnsRaw.data : (Array.isArray(grnsRaw) ? grnsRaw : []), [grnsRaw]);

    const [view, setView] = useState('list'); // 'list', 'new', 'draft', 'debit-note'
    const [activeReturn, setActiveReturn] = useState(null);
    const [search, setSearch] = useState('');
    const [draftItems, setDraftItems] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState(null);

    const [activeDeliveryChallan, setActiveDeliveryChallan] = useState(null);
    
    // Debit Note specific
    const [activeDebitNote, setActiveDebitNote] = useState(null);

    const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    const handleCreateDraft = async (grnId) => {
        setIsSubmitting(true);
        try {
            const res = await createDraftPurchaseReturn(grnId);
            setActiveReturn(res.data);
            
            // Initialize draft items with zeros
            const initialItems = {};
            res.data.grn.items.forEach(grnItem => {
                const max = grnItem.receivedQty - (grnItem.returnedQty || 0);
                if (max > 0) {
                    initialItems[grnItem.id] = {
                        grnItem: { id: grnItem.id },
                        inventoryItem: { id: grnItem.inventoryItem.id },
                        batchNumber: grnItem.batchNumber,
                        expiryDate: grnItem.expiryDate,
                        returnQty: 0,
                        reason: '',
                        remarks: ''
                    };
                }
            });
            setDraftItems(initialItems);
            setView('draft');
            refetch();
        } catch (e) {
            alert('Failed to create draft: ' + (e.response?.data?.message || e.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            const itemsToSave = Object.values(draftItems).filter(item => item.returnQty > 0);
            if (itemsToSave.length === 0) {
                alert('Please enter return quantity for at least one item.');
                return;
            }
            
            // Validate OTHER reason has remarks
            for (const item of itemsToSave) {
                if (!item.reason) {
                    alert('Reason is required for all returned items.');
                    return;
                }
                if (item.reason === 'OTHER' && !item.remarks?.trim()) {
                    alert('Remarks are required when reason is OTHER.');
                    return;
                }
            }

            setIsSubmitting(true);
            await savePurchaseReturnItems(activeReturn.id, itemsToSave);
            alert('Draft saved successfully.');
            refetch();
            setView('list');
        } catch (e) {
            alert('Failed to save draft: ' + (e.response?.data?.message || e.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmClick = () => {
        setConfirmState({
            action: 'confirm',
            title: 'Confirm Return',
            message: 'Confirming will adjust stock and generate a Debit Note. This cannot be undone. Proceed?',
            confirmText: 'Confirm Return',
            danger: false
        });
    };

    const handleDeleteClick = () => {
        setConfirmState({
            action: 'delete',
            title: 'Delete Draft',
            message: 'Are you sure you want to delete this draft?',
            confirmText: 'Delete Draft',
            danger: true
        });
    };

    const executeConfirmAction = async () => {
        if (!confirmState) return;
        const { action } = confirmState;
        
        setIsSubmitting(true);
        try {
            if (action === 'confirm') {
                const itemsToSave = Object.values(draftItems).filter(item => item.returnQty > 0);
                if (itemsToSave.length > 0) {
                    await savePurchaseReturnItems(activeReturn.id, itemsToSave);
                }

                const res = await confirmPurchaseReturn(activeReturn.id);
                setActiveDebitNote(res.data);
                setConfirmState(prev => ({
                    ...prev,
                    successMessage: 'Purchase return confirmed. Debit note generated.',
                    onSuccessAction: () => {
                        setView('debit-note');
                        refetch();
                    }
                }));
            } else if (action === 'delete') {
                await deleteDraftPurchaseReturn(activeReturn.id);
                setConfirmState(prev => ({
                    ...prev,
                    successMessage: 'Draft deleted successfully.',
                    onSuccessAction: () => {
                        refetch();
                        setView('list');
                    }
                }));
            }
        } catch (e) {
            setConfirmState(prev => ({
                ...prev,
                errorMessage: 'Action failed: ' + (e.response?.data?.message || e.message)
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadDraft = (ret) => {
        setActiveReturn(ret);
        const initialItems = {};
        ret.grn.items.forEach(grnItem => {
            const max = grnItem.receivedQty - (grnItem.returnedQty || 0);
            if (max > 0) {
                const existing = ret.items.find(i => i.grnItem.id === grnItem.id);
                initialItems[grnItem.id] = {
                    grnItem: { id: grnItem.id },
                    inventoryItem: { id: grnItem.inventoryItem.id },
                    batchNumber: grnItem.batchNumber,
                    expiryDate: grnItem.expiryDate,
                    returnQty: existing ? existing.returnQty : 0,
                    reason: existing ? existing.reason : '',
                    remarks: existing ? existing.remarks : ''
                };
            }
        });
        setDraftItems(initialItems);
        setView('draft');
    };

    // Rendering functions
    const renderList = () => {
        const filtered = returns.filter(r => r.returnNumber.toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="zu-page-content">
                <div className="filter-bar">
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search return number..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setView('new')}>
                        <Plus size={16} /> New Return
                    </button>
                </div>
                <div className="zu-table-wrapper">
                    <table className="zu-table">
                        <thead>
                            <tr>
                                <th>Return No</th>
                                <th>GRN Ref</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5">Loading...</td></tr> : 
                             filtered.length === 0 ? <tr><td colSpan="5">No returns found.</td></tr> :
                             filtered.map(r => (
                                <tr key={r.id}>
                                    <td>{r.returnNumber}</td>
                                    <td>{r.grn.grnNumber}</td>
                                    <td>{fmt(r.createdAt)}</td>
                                    <td>
                                        <span className={`status-badge ${r.status === 'CONFIRMED' ? 'status-confirmed' : 'status-draft'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {r.status === 'DRAFT' && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => loadDraft(r)}>Edit Draft</button>
                                        )}
                                        {r.status === 'CONFIRMED' && r.debitNote && (
                                            <>
                                                <button className="btn btn-primary btn-sm" style={{ marginRight: '8px' }} onClick={() => handleViewDebitNote(r)}>View DN</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleViewDeliveryChallan(r)}>View DC</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                             ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderNew = () => {
        // Find GRNs that have returnable items
        const validGrns = grns.filter(g => 
            g.items.some(i => (i.receivedQty - (i.returnedQty || 0)) > 0)
        );
        const filtered = validGrns.filter(g => g.grnNumber.toLowerCase().includes(search.toLowerCase()) || (g.purchaseOrder?.poNumber || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="zu-page-content">
                <div className="filter-bar">
                    <button className="btn btn-ghost" onClick={() => setView('list')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="filter-group flex-1">
                        <div className="search-bar">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Search GRNs to return..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                className="search-bar-input"
                            />
                        </div>
                    </div>
                </div>
                <div className="zu-table-wrapper">
                    <table className="zu-table">
                        <thead>
                            <tr>
                                <th>GRN Number</th>
                                <th>PO Number</th>
                                <th>Date Received</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? <tr><td colSpan="4">No GRNs available for return.</td></tr> :
                             filtered.map(g => (
                                 <tr key={g.id}>
                                     <td>{g.grnNumber}</td>
                                     <td>{g.purchaseOrder?.poNumber}</td>
                                     <td>{fmt(g.receivedAt)}</td>
                                     <td style={{ textAlign: 'right' }}>
                                         <button className="btn btn-primary btn-sm" onClick={() => handleCreateDraft(g.id)} disabled={isSubmitting}>
                                             Select GRN
                                         </button>
                                     </td>
                                 </tr>
                             ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderDraft = () => {
        if (!activeReturn) return null;

        return (
            <div className="zu-page-content">
                <div className="filter-bar">
                    <button className="btn btn-ghost" onClick={() => setView('list')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-danger" onClick={handleDeleteClick} disabled={isSubmitting}>
                        <Trash2 size={16} /> Discard Draft
                    </button>
                    <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
                        <Save size={16} /> Save Draft
                    </button>
                    <button className="btn btn-primary" onClick={handleConfirmClick} disabled={isSubmitting}>
                        <CheckCircle size={16} /> Confirm Return
                    </button>
                </div>

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">Return Details: {activeReturn.returnNumber}</h3>
                    </div>
                    <div className="card-body">
                        <div className="grid-2">
                            <div><strong>GRN:</strong> {activeReturn.grn.grnNumber}</div>
                            <div><strong>PO:</strong> {activeReturn.grn.purchaseOrder?.poNumber}</div>
                            <div><strong>Vendor:</strong> {activeReturn.grn.purchaseOrder?.vendor?.name}</div>
                            <div><strong>Status:</strong> {activeReturn.status}</div>
                        </div>
                    </div>
                </div>

                <div className="zu-table-wrapper">
                    <table className="zu-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Batch / Expiry</th>
                                <th>Max Returnable</th>
                                <th>Return Qty</th>
                                <th>Reason</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeReturn.grn.items.map(grnItem => {
                                const max = grnItem.receivedQty - (grnItem.returnedQty || 0);
                                if (max <= 0) return null;
                                
                                const draftState = draftItems[grnItem.id];
                                if (!draftState) return null;

                                return (
                                    <tr key={grnItem.id}>
                                        <td>{grnItem.inventoryItem.name}</td>
                                        <td>{grnItem.batchNumber || '-'} <br/> <small className="text-muted">{grnItem.expiryDate || '-'}</small></td>
                                        <td>{max}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="form-input" 
                                                style={{ width: '80px' }}
                                                min="0" max={max}
                                                value={draftState.returnQty || ''}
                                                onChange={e => {
                                                    let val = parseFloat(e.target.value) || 0;
                                                    if (val > max) val = max;
                                                    if (val < 0) val = 0;
                                                    setDraftItems(prev => ({
                                                        ...prev,
                                                        [grnItem.id]: { ...prev[grnItem.id], returnQty: val }
                                                    }));
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                className="form-select"
                                                value={draftState.reason}
                                                onChange={e => setDraftItems(prev => ({
                                                    ...prev,
                                                    [grnItem.id]: { ...prev[grnItem.id], reason: e.target.value }
                                                }))}
                                            >
                                                <option value="">Select Reason...</option>
                                                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                placeholder="Remarks..."
                                                value={draftState.remarks}
                                                onChange={e => setDraftItems(prev => ({
                                                    ...prev,
                                                    [grnItem.id]: { ...prev[grnItem.id], remarks: e.target.value }
                                                }))}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderDebitNote = () => {
        if (!activeDebitNote) return null;

        const dn = activeDebitNote;
        const ret = dn.purchaseReturn;
        const vendor = ret.grn.purchaseOrder.vendor;

        return (
            <div className="zu-page-content">
                <div className="filter-bar no-print">
                    <button className="btn btn-ghost" onClick={() => { setView('list'); refetch(); }}>
                        <ArrowLeft size={16} /> Back to List
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-ghost" style={{ marginRight: '8px' }} onClick={() => handleViewDeliveryChallan(activeDebitNote.purchaseReturn)}>
                        <Printer size={16} /> Delivery Challan
                    </button>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Debit Note
                    </button>
                </div>

                <div className="print-area" style={{ background: 'white', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2>DEBIT NOTE</h2>
                        <h4 className="text-muted">Return Ref: {ret.returnNumber}</h4>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <strong>Vendor:</strong> {vendor.name}<br/>
                            <strong>GSTIN:</strong> {dn.vendorGstin || 'Unregistered'}<br/>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <strong>Debit Note No:</strong> {dn.debitNoteNumber}<br/>
                            <strong>Date:</strong> {fmt(dn.createdAt)}<br/>
                            <strong>Hospital GSTIN:</strong> {dn.hospitalGstin || 'Unregistered'}
                        </div>
                    </div>

                    <table className="zu-table" style={{ width: '100%', marginBottom: '2rem' }}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>HSN</th>
                                <th>Reason</th>
                                <th style={{ textAlign: 'right' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                                <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                                <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                                <th style={{ textAlign: 'right' }}>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ret.items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.inventoryItem.name} <br/><small className="text-muted">Batch: {item.batchNumber || '-'}</small></td>
                                    <td>{item.hsnCode || '-'}</td>
                                    <td>{item.reason} {item.remarks ? `(${item.remarks})` : ''}</td>
                                    <td style={{ textAlign: 'right' }}>{item.returnQty}</td>
                                    <td style={{ textAlign: 'right' }}>{item.rate?.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>{item.cgstAmount?.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>{item.sgstAmount?.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>{item.lineTotal?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colSpan="7" style={{ textAlign: 'right' }}>Subtotal:</th>
                                <th style={{ textAlign: 'right' }}>{dn.subtotal?.toFixed(2)}</th>
                            </tr>
                            <tr>
                                <th colSpan="7" style={{ textAlign: 'right' }}>CGST Total:</th>
                                <th style={{ textAlign: 'right' }}>{dn.cgstTotal?.toFixed(2)}</th>
                            </tr>
                            <tr>
                                <th colSpan="7" style={{ textAlign: 'right' }}>SGST Total:</th>
                                <th style={{ textAlign: 'right' }}>{dn.sgstTotal?.toFixed(2)}</th>
                            </tr>
                            <tr>
                                <th colSpan="7" style={{ textAlign: 'right' }}>Round Off:</th>
                                <th style={{ textAlign: 'right' }}>{dn.roundOff?.toFixed(2)}</th>
                            </tr>
                            <tr>
                                <th colSpan="7" style={{ textAlign: 'right', fontSize: '1.2em' }}>Grand Total:</th>
                                <th style={{ textAlign: 'right', fontSize: '1.2em' }}>₹ {dn.totalAmount?.toFixed(2)}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    const renderDeliveryChallan = () => {
        if (!activeDeliveryChallan || !activeDebitNote) return null;

        const dc = activeDeliveryChallan;
        const dn = activeDebitNote;
        const ret = dn.purchaseReturn;
        const vendor = ret.grn.purchaseOrder.vendor;

        return (
            <div className="zu-page-content">
                <div className="filter-bar no-print">
                    <button className="btn btn-ghost" onClick={() => { setView('list'); refetch(); }}>
                        <ArrowLeft size={16} /> Back to List
                    </button>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-ghost" style={{ marginRight: '8px' }} onClick={() => setView('debit-note')}>
                        <ArrowLeft size={16} /> Back to Debit Note
                    </button>
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
                            <strong>GSTIN:</strong> {dn.vendorGstin || 'Unregistered'}<br/>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <strong>Challan No:</strong> {dc.challanNumber}<br/>
                            <strong>Date:</strong> {fmt(dc.createdAt)}<br/>
                            <strong>Ref Debit Note:</strong> {dn.debitNoteNumber}<br/>
                            <strong>Hospital GSTIN:</strong> {dn.hospitalGstin || 'Unregistered'}
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
                            {ret.items.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.inventoryItem.name}</strong><br/>
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
        <div className="zu-page">
            {confirmState && (
                <ConfirmModal 
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmText={confirmState.confirmText}
                    danger={confirmState.danger}
                    isSubmitting={isSubmitting}
                    successMessage={confirmState.successMessage}
                    errorMessage={confirmState.errorMessage}
                    onConfirm={executeConfirmAction}
                    onCancel={() => {
                        if (confirmState.onSuccessAction) {
                            confirmState.onSuccessAction();
                        }
                        setConfirmState(null);
                    }}
                />
            )}
            
            {isSubmitting && !confirmState && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Loader2 size={48} className="spin" style={{ color: 'var(--primary-color, #2563eb)', animation: 'spin 1s linear infinite' }} />
                </div>
            )}
            <PageHeader 
                title={
                    <>
                        <Package size={24} /> Purchase Returns
                    </>
                }
                subtitle="Manage stock returns to vendors and debit notes"
            />
            
            {view === 'list' && renderList()}
            {view === 'new' && renderNew()}
            {view === 'draft' && renderDraft()}
            {view === 'debit-note' && renderDebitNote()}
            {view === 'delivery-challan' && renderDeliveryChallan()}
        </div>
    );
}
