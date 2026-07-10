import { Bell, Menu, User } from 'lucide-react';

export default function Header({ onMenuClick }) {
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
                <button className="zu-topnav-bell" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="zu-topnav-bell-dot"></span>
                </button>
                <div className="zu-topnav-divider"></div>
                <div className="zu-topnav-user">
                    <div className="zu-topnav-user-avatar">
                        <User size={16} />
                    </div>
                    <div className="zu-topnav-user-text">
                        <span className="zu-topnav-user-name">Dr. Sarah</span>
                        <span className="zu-topnav-user-role">Inventory Admin</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
