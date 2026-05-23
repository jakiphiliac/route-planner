const express = require("express");
const router = express.Router();
const { getMatrix, getRoute } = require("../services/osrm");
const { solve } = require("../services/tsp");

function validate(body) {
    const errors = [];
    if (!body || typeof body !== "object") return ["Request body is required."];
    const { start, destinations } = body;
    if (!start || !isFinite(start.lat) || !isFinite(start.lng)) {
        errors.push("A valid start point is required.");
    }
    if (!Array.isArray(destinations) || destinations.length < 1) {
        errors.push("At least one destination is required.");
    } else {
        destinations.forEach((d, i) => {
            if (!isFinite(d.lat) || !isFinite(d.lng))
                errors.push(`Destination ${i + 1} has invalid coordinates.`);
        });
    }
    return errors;
}

// POST /api/optimize  -> { orderedDestinations, geometry, distanceMeters, durationSeconds }
router.post("/", async (req, res, next) => {
    try {
        const errors = validate(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const { start, destinations } = req.body;
        const points = [start, ...destinations]; // index 0 = start

        const { durations } = await getMatrix(points); // driving-time matrix
        const tour = solve(durations, 0); // e.g. [0, 3, 1, 2]

        // Map tour indices (1..n) back to destinations and close the loop for drawing.
        const orderedDestinations = tour
            .slice(1)
            .map((idx) => destinations[idx - 1]);
        const routePoints = [...tour.map((idx) => points[idx]), points[0]];
        const { geometry, distanceMeters, durationSeconds } =
            await getRoute(routePoints);

        res.json({
            orderedDestinations,
            geometry,
            distanceMeters,
            durationSeconds,
        });
    } catch (err) {
        next(err); // handled by the central error middleware
    }
});

module.exports = router;
