import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

let _id = 0;
const DURATION = 4000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const add = useCallback((message, type = 'success') => {
        const id = ++_id;
        setToasts(prev => [...prev.slice(-4), { id, message, type }]);
        setTimeout(() => dismiss(id), DURATION);
    }, [dismiss]);

    const toast = {
        success: (msg) => add(msg, 'success'),
        error:   (msg) => add(msg, 'error'),
        warn:    (msg) => add(msg, 'warning'),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="inv-toast-container" aria-live="polite" aria-atomic="false">
                {toasts.map(t => <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />)}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ t, onDismiss }) {
    const Icon = t.type === 'success' ? CheckCircle
        : t.type === 'error'   ? XCircle
        : AlertTriangle;

    return (
        <div className={`inv-toast is-${t.type}`} role="alert">
            <span className="inv-toast-icon"><Icon size={15} /></span>
            <span className="inv-toast-message">{t.message}</span>
            <button className="inv-toast-close" onClick={onDismiss} aria-label="Dismiss">
                <X size={12} />
            </button>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}
