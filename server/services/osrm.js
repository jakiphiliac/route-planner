const OSRM_BASE = process.env.OSRM_BASE || "https://router.project-osrm.org";

// OSRM wants "lng,lat;lng,lat;..."
function toCoordString(points) {
    return points.map((p) => `${p.lng},${p.lat}`).join(";");
}

// Pairwise driving-time/distance matrix — the input to the TSP solver.
async function getMatrix(points) {
    const url = `${OSRM_BASE}/table/v1/driving/${toCoordString(points)}?annotations=duration,distance`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`OSRM table request failed (HTTP ${res.status})`);
    const data = await res.json();
    if (data.code !== "Ok") throw new Error(`OSRM table error: ${data.code}`);
    return { durations: data.durations, distances: data.distances };
}

// Road-following geometry + totals for the optimised order (used to draw the line).
async function getRoute(points) {
    const url = `${OSRM_BASE}/route/v1/driving/${toCoordString(points)}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`OSRM route request failed (HTTP ${res.status})`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes.length)
        throw new Error(`OSRM route error: ${data.code}`);
    const route = data.routes[0];
    // GeoJSON coords are [lng, lat]; Leaflet wants [lat, lng].
    const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return {
        geometry,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
    };
}

module.exports = { getMatrix, getRoute };
