export default function TripList({ trips, onLoad, onDelete }) {
    if (!trips.length)
        return <p className="text-muted small mb-0">No saved trips yet.</p>;
    return (
        <ul className="list-group">
            {trips.map((t) => (
                <li
                    key={t.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                >
                    <span className="text-truncate me-2" title={t.name}>
                        {t.name}{" "}
                        <span className="badge bg-secondary">
                            {t.destinations.length}
                        </span>
                    </span>
                    <span className="btn-group btn-group-sm">
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => onLoad(t)}
                        >
                            Load
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            onClick={() => onDelete(t.id)}
                        >
                            Delete
                        </button>
                    </span>
                </li>
            ))}
        </ul>
    );
}
