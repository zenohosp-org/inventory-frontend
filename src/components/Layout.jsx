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
                <main className="zu-app-shell-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
