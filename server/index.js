const path = require("path");
const express = require("express");
require("./db"); // initialise the database & schema on boot

const tripsRouter = require("./routes/trips");
const optimizeRouter = require("./routes/optimize");
const geoRouter = require("./routes/geo");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- API routes ---
app.use("/api/trips", tripsRouter);
app.use("/api/optimize", optimizeRouter);
app.use("/api", geoRouter); // /api/geocode, /api/reverse
app.use("/api", (req, res) =>
    res.status(404).json({ errors: ["API route not found."] }),
);

// --- Serve the built client (production) ---
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => res.sendFile(path.join(clientDist, "index.html"))); // SPA fallback

// --- Central error handler: meaningful status + JSON message ---
app.use((err, req, res, next) => {
    console.error(err);
    // 502 = we failed talking to an upstream service (OSRM/Nominatim) or an unexpected error
    res.status(502).json({
        errors: [err.message || "Unexpected server error."],
    });
});

app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`),
);
