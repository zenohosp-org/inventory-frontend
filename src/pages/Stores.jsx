import { Store } from 'lucide-react';

export default function Stores() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-6 h-6 text-emerald-600" />
                Stores Master
            </h1>
            <p className="text-slate-500 mt-1">Manage hospital stores</p>
        </div>
    );
}
