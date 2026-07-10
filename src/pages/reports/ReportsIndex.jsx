import { Link } from 'react-router-dom';
import { Wallet, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import './reports.css';

const REPORTS = [
    {
        to: '/reports/stock-valuation',
        icon: Wallet,
        title: 'Stock Valuation',
        desc: 'On-hand quantity valued at cost and at selling price, with totals',
    },
    {
        to: '/reports/near-expiry',
        icon: AlertTriangle,
        title: 'Near-Expiry',
        desc: 'Batches expiring soon, with value at risk',
    },
    {
        to: '/reports/price-variance',
        icon: ArrowLeftRight,
        title: 'Price Variance',
        desc: 'How much you’ve paid for each item across purchase orders',
    },
];

export default function ReportsIndex() {
    return (
        <div className="zu-page">
            <PageHeader title="Reports" subtitle="Inventory valuation, expiry and purchasing reports" />
            <div className="zu-page-content">
                <div className="zu-report-grid">
                    {REPORTS.map(({ to, icon: Icon, title, desc }) => (
                        <Link key={to} to={to} className="zu-report-card">
                            <div className="zu-report-card-icon"><Icon size={22} /></div>
                            <div>
                                <div className="zu-report-card-title">{title}</div>
                                <div className="zu-report-card-desc">{desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
