// server/routes/geo.js
const express = require("express");
const router = express.Router();

// Photon (https://photon.komoot.io) — a free, key-less OpenStreetMap geocoder.
// We switched away from Nominatim because OSM's public Nominatim server blocks
// automated/server-side requests with HTTP 403. Photon is built for this use.
// Endpoints: GET /api?q=...  (forward)  and  GET /reverse?lat=&lon=  (reverse).
const PHOTON = process.env.PHOTON_BASE || "https://photon.komoot.io";
const HEADERS = { "User-Agent": "RoutePlannerSchoolProject/1.0" };

// Build a concise "Place, City" label from a Photon GeoJSON feature's properties.
function labelFromProps(p = {}, fallback = "") {
    const primary =
        p.name ||
        [p.street, p.housenumber].filter(Boolean).join(" ") ||
        p.district ||
        p.suburb ||
        p.locality;
    const area = p.city || p.town || p.village || p.county || p.state;
    if (primary && area) return `${primary}, ${area}`;
    return primary || area || p.country || fallback;
}

// GET /api/geocode?q=...  -> [{ label, lat, lng }]
router.get("/geocode", async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q)
            return res
                .status(400)
                .json({ errors: ['Query parameter "q" is required.'] });
        const url = `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=5`;
        const r = await fetch(url, { headers: HEADERS });
        if (!r.ok) throw new Error(`Geocoding failed (HTTP ${r.status})`);
        const data = await r.json();
        const results = (data.features || [])
            .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
            .map((f) => ({
                label: labelFromProps(f.properties),
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
            }));
        res.json(results);
    } catch (err) {
        console.error("[geocode] failed:", err.message);
        next(err);
    }
});

// GET /api/reverse?lat=..&lng=..  -> { label }
router.get("/reverse", async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng)
            return res
                .status(400)
                .json({ errors: ['"lat" and "lng" are required.'] });
        const url = `${PHOTON}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
        const r = await fetch(url, { headers: HEADERS });
        if (!r.ok)
            throw new Error(`Reverse geocoding failed (HTTP ${r.status})`);
        const data = await r.json();
        const feature = (data.features || [])[0];
        const fallback = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
        res.json({
            label: feature
                ? labelFromProps(feature.properties, fallback)
                : fallback,
        });
    } catch (err) {
        console.error("[reverse] failed:", err.message);
        next(err);
    }
});

module.exports = router;
