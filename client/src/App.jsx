import { useState, useEffect, useCallback } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { api } from "./api";

export default function App() {
    const [mode, setMode] = useState("start"); // 'start' | 'destination'
    const [start, setStart] = useState(null);
    const [destinations, setDestinations] = useState([]);
    const [route, setRoute] = useState(null);
    const [trips, setTrips] = useState([]);
    const [tripName, setTripName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);

    const flash = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    }, []);

    const loadTrips = useCallback(async () => {
        try {
            setTrips(await api.listTrips());
        } catch (e) {
            flash("danger", e.message);
        }
    }, [flash]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    async function labelFor(lat, lng) {
        try {
            return (await api.reverse(lat, lng)).label;
        } catch {
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    }

    async function handleMapClick(lat, lng) {
        const label = await labelFor(lat, lng);
        setRoute(null);
        if (mode === "start") setStart({ lat, lng, label });
        else setDestinations((prev) => [...prev, { lat, lng, label }]);
    }

    function handleSearchSelect(item) {
        setRoute(null);
        if (mode === "start") setStart(item);
        else setDestinations((prev) => [...prev, item]);
    }

    function handleUseLocation() {
        if (!navigator.geolocation)
            return flash(
                "warning",
                "Geolocation is not supported by your browser.",
            );
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setStart({ lat, lng, label: await labelFor(lat, lng) });
                setRoute(null);
                flash("success", "Start set to your current location.");
            },
            () =>
                flash(
                    "danger",
                    "Could not get your location. Allow access or set the start manually.",
                ),
        );
    }

    function removeDestination(index) {
        setDestinations((prev) => prev.filter((_, i) => i !== index));
        setRoute(null);
    }

    async function handleOptimize() {
        if (!start) return flash("warning", "Please set a start point first.");
        if (destinations.length < 1)
            return flash("warning", "Please add at least one destination.");
        try {
            setBusy(true);
            const result = await api.optimize(start, destinations);
            setDestinations(result.orderedDestinations); // reorder to the optimised sequence
            setRoute(result);
            flash("success", "Route optimised!");
        } catch (e) {
            flash("danger", e.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleSaveTrip() {
        if (!tripName.trim())
            return flash("warning", "Please enter a trip name.");
        if (!start || destinations.length < 1)
            return flash(
                "warning",
                "Set a start and at least one destination.",
            );
        const payload = { name: tripName.trim(), start, destinations };
        try {
            setBusy(true);
            if (editingId) {
                await api.updateTrip(editingId, payload);
                flash("success", "Trip updated.");
            } else {
                await api.createTrip(payload);
                flash("success", "Trip saved.");
            }
            await loadTrips();
        } catch (e) {
            flash("danger", e.message);
        } finally {
            setBusy(false);
        }
    }

    function handleLoadTrip(trip) {
        setStart(trip.start);
        setDestinations(
            trip.destinations.map((d) => ({
                label: d.label,
                lat: d.lat,
                lng: d.lng,
            })),
        );
        setTripName(trip.name);
        setEditingId(trip.id);
        setRoute(null);
        flash(
            "info",
            `Loaded "${trip.name}". Edit or re-optimise, then Update.`,
        );
    }

    async function handleDeleteTrip(id) {
        try {
            await api.deleteTrip(id);
            if (editingId === id) handleClear();
            await loadTrips();
            flash("success", "Trip deleted.");
        } catch (e) {
            flash("danger", e.message);
        }
    }

    function handleClear() {
        setStart(null);
        setDestinations([]);
        setRoute(null);
        setTripName("");
        setEditingId(null);
    }

    return (
        <div className="app">
            <MapView
                start={start}
                destinations={destinations}
                route={route}
                onMapClick={handleMapClick}
            />
            <Sidebar
                mode={mode}
                setMode={setMode}
                start={start}
                destinations={destinations}
                route={route}
                message={message}
                onUseLocation={handleUseLocation}
                onSearchSelect={handleSearchSelect}
                onRemoveDestination={removeDestination}
                onOptimize={handleOptimize}
                tripName={tripName}
                setTripName={setTripName}
                onSaveTrip={handleSaveTrip}
                onClear={handleClear}
                trips={trips}
                onLoadTrip={handleLoadTrip}
                onDeleteTrip={handleDeleteTrip}
                busy={busy}
                editingId={editingId}
            />
        </div>
    );
}
