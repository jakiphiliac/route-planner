async function request(url, options = {}) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (res.status === 204) return null; // no content (delete)
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message =
            (data.errors && data.errors.join(" ")) || "Request failed.";
        throw new Error(message);
    }
    return data;
}

export const api = {
    geocode: (q) => request(`/api/geocode?q=${encodeURIComponent(q)}`),
    reverse: (lat, lng) => request(`/api/reverse?lat=${lat}&lng=${lng}`),
    optimize: (start, destinations) =>
        request("/api/optimize", {
            method: "POST",
            body: JSON.stringify({ start, destinations }),
        }),
    listTrips: () => request("/api/trips"),
    getTrip: (id) => request(`/api/trips/${id}`),
    createTrip: (trip) =>
        request("/api/trips", { method: "POST", body: JSON.stringify(trip) }),
    updateTrip: (id, trip) =>
        request(`/api/trips/${id}`, {
            method: "PUT",
            body: JSON.stringify(trip),
        }),
    deleteTrip: (id) => request(`/api/trips/${id}`, { method: "DELETE" }),
};
