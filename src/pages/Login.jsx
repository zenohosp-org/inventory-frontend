import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';

export default function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleLoginClick = () => {
        window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    };

    const error = searchParams.get('error') ? (searchParams.get('error_description') || 'SSO login failed.') : null;

    if (searchParams.get('code')) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #3b82f6',
                        borderTop: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px',
                    }}></div>
                    <p style={{
                        color: 'white',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontSize: '12px',
                    }}>Completing SSO Login...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#0f172a',
            color: '#cbd5e1',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Left Col - Hero Information */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '40px 80px',
                zIndex: 10,
                position: 'relative',
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: 'fit-content',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    marginBottom: '32px',
                }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#60a5fa',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}>ZenoHosp Enterprise OS</span>
                </div>

                <h1 style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    marginBottom: '24px',
                    background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                }}>
                    Institutional Level<br />Asset Management
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: '#94a3b8',
                    maxWidth: '500px',
                    marginBottom: '48px',
                }}>
                    Gain full visibility over hospital equipment, transfer flows, and maintenance statuses powered by ZenoHosp's integrated security directory.
                </p>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '500',
                        color: '#cbd5e1',
                        marginBottom: '16px',
                    }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span>Centralized hardware and equipment logs</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '500',
                        color: '#cbd5e1',
                        marginBottom: '16px',
                    }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span>Automated asset transfer tracking and sign-offs</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '500',
                        color: '#cbd5e1',
                    }}>
                        <span style={{ color: '#10b981' }}>✓</span>
                        <span>Seamless global SSO authentication</span>
                    </div>
                </div>
            </div>

            {/* Right Col - Login Box */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                zIndex: 10,
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '40px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                        borderRadius: '24px 24px 0 0',
                    }}></div>

                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}>
                            <span style={{ fontSize: '40px' }}>📦</span>
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '8px',
                        }}>Welcome Back</h2>
                        <p style={{ color: '#94a3b8' }}>Please sign in to your dashboard</p>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            fontSize: '14px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            textAlign: 'center',
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            onClick={handleLoginClick}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                backgroundColor: 'white',
                                color: '#1f2937',
                                fontWeight: 'bold',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                fontSize: '16px',
                                marginBottom: '24px',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#f3f4f6';
                                e.target.style.boxShadow = '0 25px 30px -5px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>🌐</span>
                            Continue with ZenoHosp SSO
                        </button>

                        <p style={{
                            textAlign: 'center',
                            fontSize: '12px',
                            color: '#64748b',
                        }}>
                            By logging in, you agree to our Terms of Service and Privacy Policy. Auth tokens are fully encrypted via Identity Directory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
