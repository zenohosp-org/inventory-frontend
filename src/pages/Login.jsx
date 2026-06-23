import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Boxes,
    BarChart2,
    ClipboardList,
    Package,
    ShoppingCart,
    Truck,
    Warehouse,
    Layers,
    Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import './Login.css';

// Auto-rotating feature carousel. Inline icons + CSS transitions only —
// no external images, no network round-trips, so the panel renders
// instantly. All icons travel in the existing lucide bundle (zero size impact).
const SLIDES = [
    {
        title: 'Stock visibility across every store, in real time',
        sub: 'On-hand quantities, reorder points and movements on one dashboard.',
        Hero: BarChart2,
        side: [Boxes, Warehouse, Layers],
        tone: 'is-blue',
    },
    {
        title: 'Purchase orders without the back-and-forth',
        sub: 'Raise, approve and receive POs with a clear audit trail.',
        Hero: ClipboardList,
        side: [ShoppingCart, Package, Tag],
        tone: 'is-violet',
    },
    {
        title: 'Receive goods the moment they arrive',
        sub: 'GRNs reconcile against POs and update stock automatically.',
        Hero: Truck,
        side: [Package, Warehouse, ClipboardList],
        tone: 'is-amber',
    },
    {
        title: 'Multi-store inventory, fully in sync',
        sub: 'Transfers, indents and consumption stay live across locations.',
        Hero: Boxes,
        side: [Warehouse, Layers, BarChart2],
        tone: 'is-green',
    },
];

const SLIDE_INTERVAL_MS = 4500;

export default function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        const id = setInterval(
            () => setSlide((s) => (s + 1) % SLIDES.length),
            SLIDE_INTERVAL_MS
        );
        return () => clearInterval(id);
    }, []);

    const handleLoginClick = () => {
        window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    };

    const error = searchParams.get('error')
        ? searchParams.get('error_description') || 'SSO login failed.'
        : null;

    if (searchParams.get('code')) {
        return (
            <div className="hms-login-loading">
                <div className="hms-login-loading__inner">
                    <div className="hms-login-loading__spinner"></div>
                    <p className="hms-login-loading__text">Completing SSO Login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hms-login">
            {/* Left — Sign in */}
            <div className="hms-login__form-pane">
                <div className="hms-login__form-inner">
                    <div className="hms-login__brand">
                        <div className="hms-login__brand-icon">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="hms-login__brand-title">ZenoHosp</h1>
                        </div>
                    </div>

                    <div className="hms-login__heading">
                        <h2>Sign in</h2>
                        <p>to access Inventory Management</p>
                    </div>

                    {error && (
                        <div className="hms-login__alert is-danger">{error}</div>
                    )}

                    <button
                        type="button"
                        onClick={handleLoginClick}
                        className="hms-login__sso-btn"
                    >
                        <Package className="w-5 h-5" />
                        Sign in with ZenoHosp Directory
                    </button>

                    <p className="hms-login__terms">
                        Don&apos;t have a ZenoHosp account?{' '}
                        <span className="hms-login__terms-link">Contact your admin</span>
                    </p>
                </div>
            </div>

            {/* Right — Auto-rotating feature panel */}
            <div className="hms-login__visual">
                <div className="hms-login__carousel">
                    {SLIDES.map((s, i) => {
                        const Hero = s.Hero;
                        return (
                            <div
                                key={i}
                                className={`hms-login__slide ${s.tone}${
                                    i === slide ? ' is-active' : ''
                                }`}
                                aria-hidden={i !== slide}
                            >
                                <div className="hms-login__slide-stage">
                                    <div className="hms-login__slide-hero">
                                        <Hero size={56} strokeWidth={1.6} />
                                    </div>
                                    {s.side.map((Icon, idx) => (
                                        <div
                                            key={idx}
                                            className={`hms-login__slide-orb is-orb-${idx + 1}`}
                                        >
                                            <Icon size={18} strokeWidth={1.8} />
                                        </div>
                                    ))}
                                </div>
                                <div className="hms-login__slide-caption">
                                    <h3>{s.title}</h3>
                                    <p>{s.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="hms-login__dots">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSlide(i)}
                            className={`hms-login__dot${i === slide ? ' is-active' : ''}`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
