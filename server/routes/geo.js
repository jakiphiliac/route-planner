const express = require("express");
const router = express.Router();

const NOMINATIM =
    process.env.NOMINATIM_BASE || "https://nominatim.openstreetmap.org";
// Nominatim asks for an identifying User-Agent. Replace the contact with your own.
const HEADERS = {
    "User-Agent": "RoutePlannerSchoolProject/1.0 (student@example.com)",
};

// GET /api/geocode?q=...  -> [{ label, lat, lng }]
router.get("/geocode", async (req, res, next) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q)
            return res
                .status(400)
                .json({ errors: ['Query parameter "q" is required.'] });
        const url = `${NOMINATIM}/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`;
        const r = await fetch(url, { headers: HEADERS });
        if (!r.ok) throw new Error(`Geocoding failed (HTTP ${r.status})`);
        const data = await r.json();
        res.json(
            data.map((i) => ({
                label: i.display_name,
                lat: parseFloat(i.lat),
                lng: parseFloat(i.lon),
            })),
        );
    } catch (err) {
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
        const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
        const r = await fetch(url, { headers: HEADERS });
        if (!r.ok)
            throw new Error(`Reverse geocoding failed (HTTP ${r.status})`);
        const data = await r.json();
        res.json({ label: data.display_name || `${lat}, ${lng}` });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
