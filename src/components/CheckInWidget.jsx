import { useCallback, useEffect, useState } from 'react';
import { Laptop } from 'lucide-react';
import { getAttendanceStatus, attendanceCheckIn, attendanceCheckOut } from '../api/client';
import '../styles/checkin-widget.css';

/**
 * Suite-wide Remote Work check-in toggle (state lives in Directory, shared by
 * every app). Elapsed time shows in the native tooltip on hover and inline
 * when the sidebar is expanded. Check-out asks for confirmation — one
 * mis-click must not end a logged work session.
 */
export default function CheckInWidget({ expanded }) {
    const [status, setStatus] = useState(null); // { checkedIn, checkInAt, todayMinutes }
    const [busy, setBusy] = useState(false);
    // Ticker so the elapsed label re-renders each minute while checked in.
    const [, setTick] = useState(0);

    const refresh = useCallback(() => {
        getAttendanceStatus()
            .then((res) => setStatus(res.data?.data ?? res.data))
            .catch(() => setStatus(null)); // Directory unreachable — hide, never block the app
    }, []);

    useEffect(() => {
        refresh();
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, [refresh]);

    useEffect(() => {
        if (!status?.checkedIn) return;
        const t = setInterval(() => setTick(n => n + 1), 60_000);
        return () => clearInterval(t);
    }, [status?.checkedIn]);

    if (status === null) return null; // no state yet (or Directory down) — render nothing

    const elapsedMinutes = status.checkedIn && status.checkInAt
        ? Math.max(0, Math.floor((Date.now() - new Date(status.checkInAt).getTime()) / 60000))
        : 0;
    const hh = String(Math.floor(elapsedMinutes / 60)).padStart(2, '0');
    const mm = String(elapsedMinutes % 60).padStart(2, '0');
    const elapsedLabel = `${hh}:${mm} Hrs`;
    const tooltip = status.checkedIn ? `In ${elapsedLabel}` : 'Check in to start your work session';

    const toggle = async () => {
        if (busy) return;
        if (status.checkedIn && !window.confirm(`Check out? You've been in for ${elapsedLabel}.`)) return;
        setBusy(true);
        try {
            const res = status.checkedIn ? await attendanceCheckOut() : await attendanceCheckIn('REMOTE');
            setStatus(res.data?.data ?? res.data);
        } catch {
            refresh(); // converge on server truth rather than guessing
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={`checkin-widget${expanded ? '' : ' is-collapsed'}`} title={tooltip}>
            <Laptop size={16} className={`checkin-icon${status.checkedIn ? ' is-in' : ''}`} />
            {expanded && (
                <span className="checkin-label">
                    {status.checkedIn ? elapsedLabel : 'Check in'}
                </span>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={status.checkedIn}
                aria-label={status.checkedIn ? 'Check out' : 'Check in'}
                className={`checkin-toggle${status.checkedIn ? ' is-on' : ''}`}
                onClick={toggle}
                disabled={busy}
            >
                <span className="checkin-knob" />
            </button>
        </div>
    );
}
