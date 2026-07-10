import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="zu-app-shell">
            <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
            <div className="zu-app-shell-main">
                <Header onMenuClick={toggleSidebar} />
                <div className="zu-app-shell-content">
                    <div className="zu-page-content">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
