import { Link } from 'react-router-dom';
import { Wallet, AlertTriangle, ArrowLeftRight, Truck, PackageX, Clock } from 'lucide-react';
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
    {
        to: '/reports/vendor-performance',
        icon: Truck,
        title: 'Vendor Performance',
        desc: 'Spend and on-time delivery record by vendor',
    },
    {
        to: '/reports/po-aging',
        icon: Clock,
        title: 'PO Aging',
        desc: 'Orders placed but not yet fully received, sorted by how overdue',
    },
    {
        to: '/reports/dead-stock',
        icon: PackageX,
        title: 'Dead Stock',
        desc: 'Stock on hand with no outbound movement in a while',
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
