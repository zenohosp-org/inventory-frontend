import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

export default function ConfirmModal({ 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    onConfirm, 
    onCancel, 
    isSubmitting = false,
    danger = false,
    successMessage,
    errorMessage
}) {
    if (successMessage) {
        return (
            <div className="modal-overlay active">
                <div className="modal modal-sm">
                    <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
                        <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                        <h3 className="modal-title mb-2">Success</h3>
                        <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>{successMessage}</p>
                    </div>
                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={onCancel}>OK</button>
                    </div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="modal-overlay active">
                <div className="modal modal-sm">
                    <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
                        <XCircle size={48} className="mx-auto text-red-600 mb-4" />
                        <h3 className="modal-title mb-2">Error</h3>
                        <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>{errorMessage}</p>
                    </div>
                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={onCancel}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay active">
            <div className="modal modal-sm">
                <div className="modal-header">
                    <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: danger ? 'var(--color-error)' : 'inherit' }}>
                        <AlertTriangle size={18} />
                        {title}
                    </h3>
                    <button className="modal-close" onClick={onCancel} disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>{message}</p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
                        {cancelText}
                    </button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
