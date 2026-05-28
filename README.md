# Route Planner

A full-stack route optimiser that finds the shortest driving order for a set of stops.

## What it does

You pick a start point and any number of destinations on an interactive map, then hit **Optimise**. The app solves the Travelling Salesman Problem (TSP) to reorder your stops into the shortest driving route and draws the road-following path on the map with the total distance and travel time. You can also save, reload, edit, and delete named trips between sessions.

**Key features**
- Click the map or search by name to add stops
- Use your browser's GPS to set the start point
- Optimised route drawn on the map with distance + duration summary
- Save/load/delete named trips (persisted in a local SQLite database)

## Setup

### Prerequisites
- Node.js 18+

### Install & run

npm install            # server dependencies
npm run client:install # client dependencies (separate package under client/)

npm run dev            # starts both server (port 3000) and Vite dev server (port 5173)
