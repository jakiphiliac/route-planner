const express = require("express");
const router = express.Router();
const db = require("../db");

// --- Prepared statements ---
const insertTrip = db.prepare(
    `INSERT INTO trips (name, start_label, start_lat, start_lng) VALUES (?, ?, ?, ?)`,
);
const insertDest = db.prepare(
    `INSERT INTO destinations (trip_id, label, lat, lng, visit_order) VALUES (?, ?, ?, ?, ?)`,
);
const selectTrips = db.prepare(`SELECT * FROM trips ORDER BY created_at DESC`);
const selectTrip = db.prepare(`SELECT * FROM trips WHERE id = ?`);
const selectDests = db.prepare(
    `SELECT * FROM destinations WHERE trip_id = ? ORDER BY visit_order`,
);
const deleteTrip = db.prepare(`DELETE FROM trips WHERE id = ?`);
const deleteDests = db.prepare(`DELETE FROM destinations WHERE trip_id = ?`);
const updateTripRow = db.prepare(
    `UPDATE trips SET name = ?, start_label = ?, start_lat = ?, start_lng = ? WHERE id = ?`,
);

function validate(body) {
    const errors = [];
    if (!body || typeof body !== "object") return ["Request body is required."];
    if (!body.name || !String(body.name).trim())
        errors.push("Trip name is required.");
    const s = body.start;
    if (!s || !isFinite(s.lat) || !isFinite(s.lng) || !s.label)
        errors.push("A valid start point is required.");
    if (!Array.isArray(body.destinations) || body.destinations.length < 1) {
        errors.push("At least one destination is required.");
    } else {
        body.destinations.forEach((d, i) => {
            if (!isFinite(d.lat) || !isFinite(d.lng) || !d.label)
                errors.push(`Destination ${i + 1} is invalid.`);
        });
    }
    return errors;
}

// Turn DB rows into the shape the client uses.
function hydrate(trip) {
    const destinations = selectDests.all(trip.id).map((d) => ({
        id: d.id,
        label: d.label,
        lat: d.lat,
        lng: d.lng,
        visit_order: d.visit_order,
    }));
    return {
        id: trip.id,
        name: trip.name,
        start: {
            label: trip.start_label,
            lat: trip.start_lat,
            lng: trip.start_lng,
        },
        created_at: trip.created_at,
        destinations,
    };
}

// GET /api/trips  -> list
router.get("/", (req, res) => {
    res.json(selectTrips.all().map(hydrate));
});

// GET /api/trips/:id -> one
router.get("/:id", (req, res) => {
    const trip = selectTrip.get(req.params.id);
    if (!trip) return res.status(404).json({ errors: ["Trip not found."] });
    res.json(hydrate(trip));
});

// POST /api/trips -> create
router.post("/", (req, res) => {
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { name, start, destinations } = req.body;
    const tx = db.transaction(() => {
        const info = insertTrip.run(
            name.trim(),
            start.label,
            start.lat,
            start.lng,
        );
        destinations.forEach((d, i) =>
            insertDest.run(info.lastInsertRowid, d.label, d.lat, d.lng, i),
        );
        return info.lastInsertRowid;
    });
    const id = tx();
    res.status(201).json(hydrate(selectTrip.get(id)));
});

// PUT /api/trips/:id -> update (replace destinations)
router.put("/:id", (req, res) => {
    const trip = selectTrip.get(req.params.id);
    if (!trip) return res.status(404).json({ errors: ["Trip not found."] });
    const errors = validate(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const { name, start, destinations } = req.body;
    const tx = db.transaction(() => {
        updateTripRow.run(
            name.trim(),
            start.label,
            start.lat,
            start.lng,
            trip.id,
        );
        deleteDests.run(trip.id);
        destinations.forEach((d, i) =>
            insertDest.run(trip.id, d.label, d.lat, d.lng, i),
        );
    });
    tx();
    res.json(hydrate(selectTrip.get(trip.id)));
});

// DELETE /api/trips/:id -> delete (cascade removes destinations)
router.delete("/:id", (req, res) => {
    const trip = selectTrip.get(req.params.id);
    if (!trip) return res.status(404).json({ errors: ["Trip not found."] });
    deleteTrip.run(trip.id);
    res.status(204).end();
});

module.exports = router;
