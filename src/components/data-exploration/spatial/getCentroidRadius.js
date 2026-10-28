// Cells sampled to estimate the spacing: enough for a stable median, while
// staying fast for objects with hundreds of thousands of cells.
const MAX_SAMPLED_CELLS = 2000;

// Visium spots are 55um across, 100um apart (centre to centre), on a hexagonal
// grid. Visium HD bins are on a square grid and touch.
const VISIUM_SPOT_DIAMETER_TO_SPACING = 0.55;

// On a hexagonal grid a cell's 6 nearest neighbours are equally far, so the 5th
// is as far as the 1st even next to a missing spot. On a square grid (Visium HD
// bins) the 5th is sqrt(2) times as far, and further still for irregularly
// placed cells (Xenium).
const HEX_NEIGHBOURS = 5;
const MAX_HEX_NEIGHBOUR_RATIO = 1.15;

// Squared distances from points[index] to its k nearest other points with a
// non-zero distance, ascending. points are sorted by x, so the scan in each
// direction stops once the x gap alone exceeds the kth best distance found.
const nearestSquaredDistances = (points, index, k) => {
  const [px, py] = points[index];
  const best = [];
  const kthBest = () => (best.length < k ? Infinity : best[k - 1]);

  const scan = (direction) => {
    for (let i = index + direction; i >= 0 && i < points.length; i += direction) {
      const dx = points[i][0] - px;
      if (dx * dx >= kthBest()) return;

      const dy = points[i][1] - py;
      const distance = dx * dx + dy * dy;
      // cells at identical positions don't tell us the spacing
      if (distance > 0 && distance < kthBest()) {
        const at = best.findIndex((d) => d > distance);
        best.splice(at === -1 ? best.length : at, 0, distance);
        best.length = Math.min(best.length, k);
      }
    }
  };

  scan(1);
  scan(-1);

  return best;
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

/**
 * Radius of the circles drawn at cell centroids when there are no segmentations.
 *
 * Half the median distance from a cell to its nearest neighbour, so neighbouring
 * circles at most touch whatever the cell density or coordinate scale (e.g.
 * Visium HD 8um bins vs Xenium cells). Visium spots (hexagonal grid) are drawn
 * at their true size instead: 55um wide, 100um apart.
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
  const nearest = [];
  const neighbourRatios = [];
  for (let i = 0; i < points.length; i += step) {
    const distances = nearestSquaredDistances(points, i, HEX_NEIGHBOURS).map(Math.sqrt);
    if (distances.length) nearest.push(distances[0]);
    if (distances.length === HEX_NEIGHBOURS) {
      neighbourRatios.push(distances[HEX_NEIGHBOURS - 1] / distances[0]);
    }
  }

  if (!nearest.length) return fallback;

  const spacing = median(nearest);
  const isHexGrid = neighbourRatios.length > 0
    && median(neighbourRatios) <= MAX_HEX_NEIGHBOUR_RATIO;

  return (isHexGrid ? spacing * VISIUM_SPOT_DIAMETER_TO_SPACING : spacing) / 2;
};

export default getCentroidRadius;
