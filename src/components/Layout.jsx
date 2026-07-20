import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProductTour from './ProductTour';

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="zu-app-shell">
            <ProductTour />
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
