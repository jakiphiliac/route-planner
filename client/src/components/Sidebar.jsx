import SearchBox from "./SearchBox";
import TripList from "./TripList";

export default function Sidebar(props) {
    const {
        mode,
        setMode,
        start,
        destinations,
        route,
        message,
        onUseLocation,
        onSearchSelect,
        onRemoveDestination,
        onOptimize,
        tripName,
        setTripName,
        onSaveTrip,
        onClear,
        trips,
        onLoadTrip,
        onDeleteTrip,
        busy,
        editingId,
    } = props;

    const km = route ? (route.distanceMeters / 1000).toFixed(1) : null;
    const min = route ? Math.round(route.durationSeconds / 60) : null;

    return (
        <div className="sidebar card shadow">
            <div className="card-body">
                <h5 className="card-title mb-3">Route Planner</h5>

                {message && (
                    <div
                        className={`alert alert-${message.type} py-2 px-3 small`}
                        role="alert"
                    >
                        {message.text}
                    </div>
                )}

                {/* Map-click mode */}
                <div
                    className="btn-group btn-group-sm w-100 mb-2"
                    role="group"
                    aria-label="Map click mode"
                >
                    <button
                        className={`btn ${mode === "start" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setMode("start")}
                    >
                        Set start by click
                    </button>
                    <button
                        className={`btn ${mode === "destination" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setMode("destination")}
                    >
                        Add stops by click
                    </button>
                </div>

                <button
                    className="btn btn-sm btn-outline-secondary w-100 mb-3"
                    onClick={onUseLocation}
                >
                    📍 Use my current location as start
                </button>

                <label className="form-label fw-bold small mb-1">
                    Start point
                </label>
                <p className="small text-truncate mb-2">
                    {start ? (
                        start.label
                    ) : (
                        <span className="text-muted">Not set</span>
                    )}
                </p>

                <label className="form-label fw-bold small mb-1">
                    Add a destination
                </label>
                <SearchBox
                    onSelect={onSearchSelect}
                    placeholder="Search an address or place…"
                />

                <label className="form-label fw-bold small mb-1">
                    Destinations ({destinations.length})
                </label>
                {destinations.length === 0 ? (
                    <p className="text-muted small">
                        Add at least one destination.
                    </p>
                ) : (
                    <ol className="ps-3 small">
                        {destinations.map((d, i) => (
                            <li
                                key={i}
                                className="d-flex justify-content-between align-items-start"
                            >
                                <span
                                    className="text-truncate me-2"
                                    title={d.label}
                                >
                                    {d.label}
                                </span>
                                <button
                                    className="btn btn-sm btn-link text-danger p-0"
                                    onClick={() => onRemoveDestination(i)}
                                    aria-label={`Remove destination ${i + 1}`}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ol>
                )}

                <button
                    className="btn btn-success w-100 my-2"
                    disabled={busy || !start || destinations.length < 1}
                    onClick={onOptimize}
                >
                    {busy ? "Optimising…" : "Optimise route"}
                </button>

                {route && (
                    <div className="alert alert-info py-2 px-3 small mb-2">
                        Total: <strong>{km} km</strong> · ~
                        <strong>{min} min</strong> (round trip)
                    </div>
                )}

                <hr />
                <label className="form-label fw-bold small mb-1">
                    {editingId ? "Update saved trip" : "Save this trip"}
                </label>
                <div className="input-group input-group-sm mb-1">
                    <input
                        className="form-control"
                        placeholder="Trip name"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        aria-label="Trip name"
                    />
                    <button
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={onSaveTrip}
                    >
                        {editingId ? "Update" : "Save"}
                    </button>
                </div>
                <button
                    className="btn btn-sm btn-outline-secondary w-100 mb-3"
                    onClick={onClear}
                >
                    Clear / new trip
                </button>

                <hr />
                <label className="form-label fw-bold small mb-1">
                    Saved trips
                </label>
                <TripList
                    trips={trips}
                    onLoad={onLoadTrip}
                    onDelete={onDeleteTrip}
                />
            </div>
        </div>
    );
}
