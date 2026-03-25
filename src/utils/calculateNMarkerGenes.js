/**
 * Calculates the number of marker genes to display based on dataset size and cluster count.
 * Logic:
 * - Default: 5 markers (max)
 * - If > 500K cells: max = 30 / clusterCount (min 1)
 * - If > 250K cells: max = 60 / clusterCount (min 1)
 * - Otherwise: 5 markers
 *
 * @param {number} totalCells - Total number of cells in the dataset
 * @param {number} clusterCount - Number of clusters
 * @returns {number} Number of marker genes to display (min 1, max 5)
 */
const calculateNMarkerGenes = (totalCells, clusterCount) => {
  const DEFAULT_MARKERS = 5;
  const MIN_MARKERS = 1;

  // If we don't have valid data, use default
  if (!totalCells || !clusterCount) {
    return DEFAULT_MARKERS;
  }

  if (totalCells > 500000) {
    // (clusters * markers) < 30
    return Math.max(MIN_MARKERS, Math.min(DEFAULT_MARKERS, Math.floor(30 / clusterCount)));
  }

  if (totalCells > 250000) {
    // (clusters * markers) < 60
    return Math.max(MIN_MARKERS, Math.min(DEFAULT_MARKERS, Math.floor(60 / clusterCount)));
  }

  // Default for smaller datasets
  return DEFAULT_MARKERS;
};

export default calculateNMarkerGenes;
