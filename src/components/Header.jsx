import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/header.css';

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();

    const nameParts = (user?.name || '').split(' ').filter(Boolean);
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
        : (nameParts[0]?.[0] ?? 'U');

    return (
        <header className="inv-header">
            <button
                onClick={onMenuClick}
                className="inv-header-menu-btn"
                aria-label="Toggle sidebar"
            >
                <Menu size={20} />
            </button>

            <span className="inv-header-title">Inventory Management</span>

            <div className="inv-header-right">
                <button className="inv-header-bell-btn" aria-label="Notifications">
                    <Bell size={16} />
                    <span className="inv-header-bell-dot" />
                </button>

                <div className="inv-header-divider" />

                <div className="inv-header-user">
                    <div className="inv-header-avatar">
                        {initials.toUpperCase()}
                    </div>
                    <div className="inv-header-name-group">
                        <span className="inv-header-name">{user?.name || 'User'}</span>
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
