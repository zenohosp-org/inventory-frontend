import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/header.css';

export default function Header() {
    const { user, logout } = useAuth();

    const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
    const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || 'U';

    return (
        <header className="inv-header">
            <span className="inv-header-title">Inventory Management</span>

            <div className="inv-header-right">
                <div className="inv-header-divider" />

                <div className="inv-header-user">
                    <div className="inv-header-avatar">
                        {initials.toUpperCase()}
                    </div>
                    <div className="inv-header-name-group">
                        <span className="inv-header-name">{displayName}</span>
                        <span className="inv-header-role">{user?.role}</span>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="inv-header-logout-btn"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
