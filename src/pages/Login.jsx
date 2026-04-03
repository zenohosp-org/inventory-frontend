import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Globe, Box, CheckCircle } from 'lucide-react';
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
        // Redirect via Vite proxy → Inventory Backend → Directory Backend
        window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    };

    const error = searchParams.get('error') ? (searchParams.get('error_description') || 'SSO login failed.') : null;

    if (searchParams.get('code')) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white font-bold tracking-widest uppercase text-xs animate-pulse">Completing SSO Login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden text-slate-300">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Left Col - Hero Information */}
            <div className="flex-1 flex flex-col justify-center px-10 md:px-20 z-10 relative">
                <div className="inline-flex items-center gap-3 w-max bg-blue-600/10 border border-blue-600/20 px-4 py-2 rounded-full mb-8">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-blue-400 tracking-wider uppercase">ZenoHosp Enterprise OS</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
                    Institutional Level <br />Asset Management
                </h1>

                <p className="text-xl text-slate-400 max-w-xl mb-12">
                    Gain full visibility over hospital equipment, transfer flows, and maintenance statuses powered by ZenoHosp's integrated security directory.
                </p>

                <div className="space-y-4 font-medium text-slate-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>Centralized hardware and equipment logs</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>Automated asset transfer tracking and sign-offs</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>Seamless global SSO authentication</span>
                    </div>
                </div>
            </div>

            {/* Right Col - Login Box */}
            <div className="flex-1 flex items-center justify-center p-8 z-10">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/10 rounded-2xl mb-6 shadow-inner border border-blue-500/20">
                            <Box className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400">Please sign in to your dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 flex justify-center text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6 pt-2">
                        <button
                            onClick={handleLoginClick}
                            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] group"
                        >
                            <Globe className="w-6 h-6 text-blue-600 group-hover:rotate-12 transition-transform" />
                            Continue with ZenoHosp SSO
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            By logging in, you agree to our Terms of Service and Privacy Policy. Auth tokens are fully encrypted via Identity Directory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
