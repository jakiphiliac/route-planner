import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default marker image paths when bundling with Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const startIcon = L.divIcon({
    className: "marker-pin marker-start",
    html: "<span>S</span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const numberedIcon = (n) =>
    L.divIcon({
        className: "marker-pin marker-dest",
        html: `<span>${n}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

// Captures map clicks and forwards the coordinates upward.
function ClickHandler({ onMapClick }) {
    useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
    return null;
}

export default function MapView({ start, destinations, route, onMapClick }) {
    const center = start ? [start.lat, start.lng] : [47.4979, 19.0402]; // default: Budapest

    return (
        <MapContainer center={center} zoom={12} className="map-root">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={onMapClick} />

            {start && (
                <Marker position={[start.lat, start.lng]} icon={startIcon}>
                    <Popup>Start: {start.label}</Popup>
                </Marker>
            )}

            {destinations.map((d, i) => (
                <Marker
                    key={i}
                    position={[d.lat, d.lng]}
                    icon={numberedIcon(i + 1)}
                >
                    <Popup>
                        {i + 1}. {d.label}
                    </Popup>
                </Marker>
            ))}

            {route && route.geometry && (
                <Polyline positions={route.geometry} weight={5} />
            )}
        </MapContainer>
    );
}
