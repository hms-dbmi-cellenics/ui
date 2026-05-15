import seedrandom from 'seedrandom';
import lruMemoize from 'lru-memoize';

/**
 * Downsamples cell order for marker heatmap based on:
 * - Selected cell set
 * - Grouped tracks (cartesian product buckets)
 * - Hidden cell sets (to exclude)
 * - Maximum cells threshold
 *
 * This logic was previously in the Python worker; now it's client-side.
 * Mirrors the logic in worker/python/src/worker/helpers/get_heatmap_cell_order.py
 *
 * @param {string} selectedCellSet - Key of the primary cell set (e.g., "louvain")
 * @param {string[]} groupedTracks - Array of cell set keys for cartesian product
 * @param {Set|string[]} hiddenCellSets - Cell set keys to exclude
 * @param {object} cellSets - Cell sets structure with hierarchy and properties
 * @param {number} maxCells - Maximum cells to return after downsampling (default 1000)
 * @returns {number[]} Array of cell IDs to display, downsampled proportionally
 */

const getHeatmapCellOrder = (
  selectedCellSet,
  groupedTracks,
  hiddenCellSets,
  cellSets,
  maxCells = 1000,
) => {
  if (
    !cellSets
    || !cellSets.hierarchy
    || !cellSets.properties
    || !groupedTracks
    || !selectedCellSet
  ) {
    return [];
  }

  const { hierarchy, properties } = cellSets;

  // Normalize hiddenCellSets before using it (could be null, undefined, Set, or array)
  const normalizedHiddenCellSets = hiddenCellSets instanceof Set
    ? Array.from(hiddenCellSets)
    : (hiddenCellSets || []);

  // Create a seed from the function inputs to ensure deterministic downsampling
  const seedString = `${selectedCellSet}|${groupedTracks.join(',')}|${normalizedHiddenCellSets.join(',')}`;
  const random = seedrandom(seedString);

  // Helper to get all cell IDs in a cell class (root node)
  const getCellClassIds = (key) => {
    const cellClassNode = hierarchy.find((node) => node.key === key);
    if (!cellClassNode) return new Set();

    const cellIds = new Set();
    cellClassNode.children.forEach((child) => {
      const childCellIds = properties[child.key]?.cellIds || new Set();
      childCellIds.forEach((id) => cellIds.add(id));
    });
    return cellIds;
  };

  // Start with all cells from louvain (as in the Python implementation)
  const filteredCellIds = getCellClassIds('louvain');

  // Helper to get cells, intersecting with filteredCellIds
  const getCells = (key, isRootNode = false) => {
    let unfilteredCellIds;

    if (isRootNode) {
      unfilteredCellIds = getCellClassIds(key);
    } else {
      unfilteredCellIds = properties[key]?.cellIds || new Set();
    }

    // Intersect with filtered_cell_ids (cells in louvain)
    // Optimize: iterate through smaller set instead of spreading larger set
    const intersection = new Set();
    unfilteredCellIds.forEach((id) => {
      if (filteredCellIds.has(id)) {
        intersection.add(id);
      }
    });

    return intersection;
  };

  // Get all enabled (non-hidden) cells
  const getAllEnabledCellIds = () => {
    // Get cells from the selected cell set
    const cellIds = getCells(selectedCellSet, true);

    // Remove hidden cells - avoid array conversion
    normalizedHiddenCellSets.forEach((hiddenKey) => {
      const hiddenCellIds = getCells(hiddenKey);
      hiddenCellIds.forEach((id) => {
        cellIds.delete(id);
      });
    });

    return cellIds;
  };

  // Get intersections of a bucket with a cell class
  const getIntersections = (bucket, cellClass) => {
    const cellClassNode = hierarchy.find((node) => node.key === cellClass);
    if (!cellClassNode) return [];

    const intersections = [];

    // For each child in the cell class
    cellClassNode.children.forEach((child) => {
      const childCellIds = properties[child.key]?.cellIds || new Set();
      const intersection = new Set();

      // Only iterate through the smaller set to build intersection
      if (childCellIds.size < bucket.size) {
        childCellIds.forEach((id) => {
          if (bucket.has(id)) {
            intersection.add(id);
          }
        });
      } else {
        bucket.forEach((id) => {
          if (childCellIds.has(id)) {
            intersection.add(id);
          }
        });
      }

      if (intersection.size > 0) {
        intersections.push(intersection);
      }
    });

    return intersections;
  };

  // Perform cartesian product intersection for a single track
  const cartesianProductIntersection = (buckets, cellClass) => {
    const newBuckets = [];

    buckets.forEach((bucket) => {
      const intersections = getIntersections(bucket, cellClass);

      // Calculate leftover cells (not in any intersection) - avoid array conversion
      const leftoverCells = new Set(bucket);
      intersections.forEach((intersection) => {
        // Remove intersection cells from leftover without converting to array
        intersection.forEach((id) => {
          leftoverCells.delete(id);
        });
      });

      // Add all intersections
      intersections.forEach((intersection) => {
        newBuckets.push(intersection);
      });

      // Add leftover cells as their own bucket
      if (leftoverCells.size > 0) {
        newBuckets.push(leftoverCells);
      }
    });

    return newBuckets;
  };

  // Split into cartesian product buckets
  const splitByCartesianIntersections = (enabledCellIds) => {
    let buckets = [enabledCellIds];

    // For each grouped track, split buckets by intersection
    groupedTracks.forEach((cellClass) => {
      buckets = cartesianProductIntersection(buckets, cellClass);
    });

    // Calculate total size across all buckets
    let totalSize = 0;
    buckets.forEach((bucket) => {
      totalSize += bucket.size;
    });

    return { buckets, totalSize };
  };

  // Downsample buckets proportionally
  const downsample = (buckets, totalSize) => {
    const downsampledCellIds = [];
    const finalSampleSize = Math.min(totalSize, maxCells);

    buckets.forEach((bucket) => {
      const sampleSize = Math.floor(
        (bucket.size / totalSize) * finalSampleSize,
      );

      if (sampleSize > 0) {
        // Deterministic sample from bucket using seeded random
        const bucketArray = Array.from(bucket);
        const sample = [];
        const bucketCopy = [...bucketArray];

        for (let i = 0; i < sampleSize; i += 1) {
          const randomIndex = Math.floor(random() * bucketCopy.length);
          sample.push(bucketCopy[randomIndex]);
          bucketCopy.splice(randomIndex, 1);
        }

        downsampledCellIds.push(...sample);
      }
    });

    return downsampledCellIds;
  };

  const enabledCellIds = getAllEnabledCellIds();

  if (groupedTracks.length === 0 || enabledCellIds.size === 0) {
    return [];
  }

  const { buckets, totalSize } = splitByCartesianIntersections(enabledCellIds);
  const result = downsample(buckets, totalSize);

  return result;
};

/**
 * Compute which cell sets should be hidden based on user selections
 * Mirrors the logic in updateDownsampledCellOrder thunk
 */
const computeHiddenCellSets = (selectedPoints, cellSets) => {
  let hiddenCellSets = Array.from(cellSets.hidden || []);

  // Compute which cell sets should be hidden based on selectedPoints
  if (selectedPoints && selectedPoints !== 'All') {
    const parts = selectedPoints.split('/');
    if (parts.length === 2) {
      const [categoryKey, selectedCellSetKey] = parts;
      const categoryRoot = cellSets.hierarchy.find(
        (node) => node.key === categoryKey,
      );

      if (categoryRoot?.children) {
        categoryRoot.children.forEach((child) => {
          if (child.key !== selectedCellSetKey) {
            if (!hiddenCellSets.includes(child.key)) {
              hiddenCellSets.push(child.key);
            }
          } else {
            // Include the selected cell set even if it was manually hidden
            hiddenCellSets = hiddenCellSets.filter(
              (key) => key !== child.key,
            );
          }
        });
      }
    }
  }

  return hiddenCellSets;
};

// Memoize getHeatmapCellOrder to avoid recomputation with same inputs
const memoizedGetHeatmapCellOrder = lruMemoize(10)(getHeatmapCellOrder);

export { computeHiddenCellSets };
export default memoizedGetHeatmapCellOrder;
