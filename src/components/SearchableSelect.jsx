import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/searchable-select.css';

export default function SearchableSelect({ value, onChange, options, getId, getLabel, placeholder = 'Search...', required = false, disabled = false }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selected = options.find(o => getId(o) === value) || null;
    const displayValue = open ? search : (selected ? getLabel(selected) : '');
    const filtered = options.filter(o => getLabel(o).toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        function onClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function handleSelect(option) {
        onChange(getId(option));
        setSearch('');
        setOpen(false);
    }

    function handleInputChange(e) {
        setSearch(e.target.value);
        setOpen(true);
        if (!e.target.value) onChange('');
    }

    return (
        <div className="ss-wrapper" ref={ref}>
            <div className="ss-input-wrap">
                <input
                    type="text"
                    className="form-input"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={() => { setOpen(true); setSearch(''); }}
                    placeholder={placeholder}
                    required={required && !value}
                    disabled={disabled}
                    autoComplete="off"
                />
                <ChevronDown className="ss-chevron" />
            </div>
            {open && filtered.length > 0 && (
                <div className="ss-dropdown">
                    {filtered.map(o => (
                        <button key={getId(o)} type="button" className="ss-item" onClick={() => handleSelect(o)}>
                            {getLabel(o)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
