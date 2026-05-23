// Closed-loop TSP heuristic operating on a cost matrix (e.g. driving durations).
// Index 0 is the fixed start and the tour returns to it.

function tourCost(tour, matrix) {
    let cost = 0;
    for (let i = 0; i < tour.length - 1; i++)
        cost += matrix[tour[i]][tour[i + 1]];
    cost += matrix[tour[tour.length - 1]][tour[0]]; // close the loop back to start
    return cost;
}

// Greedy: always hop to the nearest unvisited node.
function nearestNeighbour(matrix, start = 0) {
    const n = matrix.length;
    const visited = new Array(n).fill(false);
    const tour = [start];
    visited[start] = true;

    for (let step = 1; step < n; step++) {
        const last = tour[tour.length - 1];
        let best = -1;
        let bestDist = Infinity;
        for (let j = 0; j < n; j++) {
            if (!visited[j] && matrix[last][j] < bestDist) {
                bestDist = matrix[last][j];
                best = j;
            }
        }
        tour.push(best);
        visited[best] = true;
    }
    return tour;
}

// 2-opt: repeatedly reverse a segment if it shortens the tour. Start (index 0) stays fixed.
function twoOpt(initial, matrix) {
    let best = initial.slice();
    let improved = true;
    while (improved) {
        improved = false;
        for (let i = 1; i < best.length - 1; i++) {
            for (let k = i + 1; k < best.length; k++) {
                const candidate = best
                    .slice(0, i)
                    .concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
                if (
                    tourCost(candidate, matrix) <
                    tourCost(best, matrix) - 1e-9
                ) {
                    best = candidate;
                    improved = true;
                }
            }
        }
    }
    return best;
}

function solve(matrix, start = 0) {
    if (matrix.length <= 2) return matrix.map((_, i) => i); // nothing to optimise
    return twoOpt(nearestNeighbour(matrix, start), matrix);
}

module.exports = { solve, tourCost };
