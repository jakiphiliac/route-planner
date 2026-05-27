// client/src/App.jsx
import { useState, useEffect, useCallback } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { api } from "./api";

// --- Throttled reverse-geocoding queue (be polite to the geocoder) ---
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let reverseChain = Promise.resolve();
function queueReverse(lat, lng) {
    const result = reverseChain.then(async () => {
        try {
            return (await api.reverse(lat, lng)).label;
        } catch {
            return null;
        }
    });
    reverseChain = result.then(
        () => delay(1100),
        () => delay(1100),
    );
    return result;
}

let nextCid = 1;
const makeCid = () => `c${nextCid++}`;
const coordLabel = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

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
    const [focus, setFocus] = useState(null); // coordinate the map should fly to

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

    function resolveDestinationName(cid, lat, lng) {
        queueReverse(lat, lng).then((label) => {
            if (!label) return;
            setDestinations((prev) =>
                prev.map((d) => (d.cid === cid ? { ...d, label } : d)),
            );
        });
    }

    function handleMapClick(lat, lng) {
        setRoute(null);
        if (mode === "start") {
            setStart({ lat, lng, label: coordLabel(lat, lng) });
            queueReverse(lat, lng).then((label) => {
                if (label)
                    setStart((prev) =>
                        prev && prev.lat === lat && prev.lng === lng
                            ? { ...prev, label }
                            : prev,
                    );
            });
        } else {
            const cid = makeCid();
            setDestinations((prev) => [
                ...prev,
                { cid, lat, lng, label: coordLabel(lat, lng) },
            ]);
            resolveDestinationName(cid, lat, lng);
        }
    }

    function handleSearchSelect(item) {
        setRoute(null);
        setFocus({ lat: item.lat, lng: item.lng }); // fly to the searched place
        if (mode === "start") setStart(item);
        else setDestinations((prev) => [...prev, { cid: makeCid(), ...item }]);
    }

    function handleUseLocation() {
        if (!navigator.geolocation) {
            return flash(
                "warning",
                "Geolocation is not supported by your browser.",
            );
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setStart({ lat, lng, label: coordLabel(lat, lng) });
                setRoute(null);
                setFocus({ lat, lng }); // move the map to wherever you actually are
                queueReverse(lat, lng).then((label) => {
                    if (label)
                        setStart((prev) => (prev ? { ...prev, label } : prev));
                });
                flash("success", "Start set to your current location.");
            },
            (err) => {
                const msg =
                    err.code === err.PERMISSION_DENIED
                        ? "Location permission was denied. Allow it from the browser address bar, or set the start by clicking the map."
                        : err.code === err.TIMEOUT
                          ? "Getting your location timed out. Try again, or set the start manually."
                          : "Could not get your location. Set the start by clicking the map or using search.";
                flash("danger", msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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
                cid: makeCid(),
                label: d.label,
                lat: d.lat,
                lng: d.lng,
            })),
        );
        setTripName(trip.name);
        setEditingId(trip.id);
        setRoute(null);
        setFocus({ lat: trip.start.lat, lng: trip.start.lng }); // fly to the loaded trip
        flash(
            "info",
            `Loaded "${trip.name}". Eit or re-optimise, then Update.`,
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
                focus={focus}
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
