// Cells sampled to estimate the spacing: enough for a stable median, while
// staying fast for objects with hundreds of thousands of cells.
const MAX_SAMPLED_CELLS = 2000;

// Distance from points[index] to its nearest other point with a non-zero
// distance. points are sorted by x, so the scan in each direction stops once
// the x gap alone exceeds the best distance found.
const nearestDistance = (points, index) => {
  const [px, py] = points[index];
  let best = Infinity;

  const scan = (direction) => {
    for (let i = index + direction; i >= 0 && i < points.length; i += direction) {
      const dx = points[i][0] - px;
      if (dx * dx >= best) return;

      const dy = points[i][1] - py;
      const distance = dx * dx + dy * dy;
      // cells at identical positions don't tell us the spacing
      if (distance > 0 && distance < best) best = distance;
    }
  };

  scan(1);
  scan(-1);

  return Math.sqrt(best);
};

/**
 * Radius of the circles drawn at cell centroids when there are no segmentations.
 *
 * Half the median distance from a cell to its nearest neighbour, so neighbouring
 * circles at most touch whatever the cell density or coordinate scale (e.g.
 * Visium HD 8um bins vs Xenium cells).
 *
 * @param {Map} positions cell id -> [x, y]
 * @param {number} fallback radius used when the spacing can't be estimated
 * @returns {number} radius in the same units as the positions
 */
const getCentroidRadius = (positions, fallback) => {
  const points = Array.from(positions.values()).sort((a, b) => a[0] - b[0]);
  if (points.length < 2) return fallback;

  // evenly spaced sample, so the estimate is deterministic
  const step = Math.max(1, Math.floor(points.length / MAX_SAMPLED_CELLS));
  const distances = [];
  for (let i = 0; i < points.length; i += step) {
    const distance = nearestDistance(points, i);
    if (Number.isFinite(distance)) distances.push(distance);
  }

  if (!distances.length) return fallback;

  distances.sort((a, b) => a - b);
  const median = distances[Math.floor(distances.length / 2)];

  return median / 2;
};

export default getCentroidRadius;
