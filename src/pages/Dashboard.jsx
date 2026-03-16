import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    useEffect(() => {
        // Just redirect to stock overview for now
        navigate('/stock-overview');
    }, [navigate]);

    return null;
}
