import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CheckInWidget from './CheckInWidget';

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const initials = (user?.email?.[0] || "U").toUpperCase();

    return (
        <header className="zu-topnav">
            <button
                className="zu-topnav-burger"
                onClick={onMenuClick}
                aria-label="Toggle menu"
            >
                <Menu size={20} />
            </button>
            <div className="zu-topnav-title">Inventory Manager</div>
            <div className="zu-topnav-right">
                <CheckInWidget />
                <button className="zu-topnav-bell" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="zu-topnav-bell-dot"></span>
                </button>
                <div className="zu-topnav-divider"></div>
                <div className="zu-topnav-user">
                    <div 
                        className="zu-topnav-user-profile-link"
                        onClick={() => navigate('/profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                        title="View Profile"
                    >
                        <div className="zu-topnav-user-avatar">{initials}</div>
                        <div className="zu-topnav-user-text">
                            <span className="zu-topnav-user-name">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.email?.split('@')[0] || "User")}</span>
                            <span className="zu-topnav-user-role" style={{ textTransform: 'none' }}>{user?.email || 'Inventory Admin'}</span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        aria-label="Logout"
                        className="zu-topnav-logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
