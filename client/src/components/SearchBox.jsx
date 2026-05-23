import { useState, useEffect, useRef } from "react";
import { api } from "../api";

export default function SearchBox({ onSelect, placeholder }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        if (query.trim().length < 3) {
            setResults([]);
            return;
        }
        // Debounce ~450ms to stay within Nominatim's fair-use policy.
        timer.current = setTimeout(async () => {
            try {
                setLoading(true);
                setResults(await api.geocode(query));
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 450);
        return () => clearTimeout(timer.current);
    }, [query]);

    function pick(item) {
        onSelect(item);
        setQuery("");
        setResults([]);
    }

    return (
        <div className="position-relative mb-2">
            <input
                className="form-control form-control-sm"
                placeholder={placeholder || "Search a place…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search for a place"
            />
            {loading && <div className="form-text">Searching…</div>}
            {results.length > 0 && (
                <ul className="list-group position-absolute w-100 search-results">
                    {results.map((r, i) => (
                        <li
                            key={i}
                            className="list-group-item list-group-item-action small"
                            role="button"
                            onClick={() => pick(r)}
                        >
                            {r.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
