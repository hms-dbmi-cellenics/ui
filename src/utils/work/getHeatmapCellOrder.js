/**
 * Seeded random number generator (mulberry32) for deterministic downsampling.
 * @param {number} seed - The seed value
 * @returns {Function} A function that returns the next random number [0, 1)
 */
const createSeededRandom = (seed) => {
  return function mulberry32() {
    let t = seed; // eslint-disable-line no-param-reassign
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let tf = (t ^ (t >>> 15)) * (t | 1);
    tf = tf ^ tf + (tf ^ (tf >>> 7)) * (tf | 61) | 0;
    return ((tf ^ (tf >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Creates a deterministic seed from enabled cell IDs for consistent downsampling.
 * @param {Set} enabledCellIds - Set of cell IDs to hash
 * @returns {number} A seed value
 */
const hashCellIds = (enabledCellIds) => {
  let hash = 0;
  let count = 0;
  enabledCellIds.forEach((cellId) => {
    hash = ((hash << 5) - hash + cellId) | 0;
    count += 1;
  });
  // Include the size for additional uniqueness
  hash = ((hash << 5) - hash + count) | 0;
  return Math.abs(hash);
};

/**
 * Downsamples cell order for marker heatmap based on:
 * - Selected cell set
 * - Grouped tracks (cartesian product buckets)
 * - Selected points (e.g., specific sample or patient)
 * - Hidden cell sets (to exclude)
 * - Maximum cells threshold
 *
 * This logic was previously in the Python worker; now it's client-side.
 * Mirrors the logic in worker/python/src/worker/helpers/get_heatmap_cell_order.py
 *
 * @param {string} selectedCellSet - Key of the primary cell set (e.g., "louvain")
 * @param {string[]} groupedTracks - Array of cell set keys for cartesian product
 * @param {string} selectedPoints - Either "All" or a specific cell set key
 * @param {Set|string[]} hiddenCellSets - Cell set keys to exclude
 * @param {object} cellSets - Cell sets structure with hierarchy and properties
 * @param {number} maxCells - Maximum cells to return after downsampling (default 1000)
 * @returns {number[]} Array of cell IDs to display, downsampled proportionally
 */
const getHeatmapCellOrder = (
  selectedCellSet,
  groupedTracks,
  selectedPoints,
  hiddenCellSets,
  cellSets,
  maxCells = 1000,
) => {
  if (!cellSets || !cellSets.hierarchy || !cellSets.properties) {
    return [];
  }

  const { hierarchy, properties } = cellSets;

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
    return new Set(
      [...filteredCellIds].filter((id) => unfilteredCellIds.has(id)),
    );
  };

  // Get all enabled (non-hidden, non-filtered) cells
  const getAllEnabledCellIds = () => {
    // Get cells from the selected cell set
    let cellIds = getCells(selectedCellSet, true);

    // If selectedPoints is not "All", further filter to that cell set
    if (selectedPoints && selectedPoints !== 'All') {
      cellIds = new Set(
        [...cellIds].filter((id) => getCells(selectedPoints).has(id)),
      );
    }

    // Remove hidden cells
    const hiddenArray = hiddenCellSets instanceof Set
      ? Array.from(hiddenCellSets)
      : (hiddenCellSets || []);

    hiddenArray.forEach((hiddenKey) => {
      const hiddenCellIds = getCells(hiddenKey);
      cellIds = new Set([...cellIds].filter((id) => !hiddenCellIds.has(id)));
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
      const intersection = new Set(
        [...bucket].filter((id) => childCellIds.has(id)),
      );

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

      // Calculate leftover cells (not in any intersection)
      let leftoverCells = new Set(bucket);
      intersections.forEach((intersection) => {
        leftoverCells = new Set(
          [...leftoverCells].filter((id) => !intersection.has(id)),
        );
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

  const enabledCellIds = getAllEnabledCellIds();

  if (groupedTracks.length === 0 || enabledCellIds.size === 0) {
    return [];
  }

  const { buckets, totalSize } = splitByCartesianIntersections(
    enabledCellIds,
  );

  // Debug logging [TEMPORARY]
  console.log('[getHeatmapCellOrder] enabledCellIds:', enabledCellIds.size);
  console.log('[getHeatmapCellOrder] totalSize:', totalSize);
  console.log('[getHeatmapCellOrder] buckets.length:', buckets.length);
  console.log('[getHeatmapCellOrder] buckets sizes:', buckets.map((b) => b.size));
  console.log('[getHeatmapCellOrder] groupedTracks:', groupedTracks);

  // Create a seeded RNG for deterministic downsampling
  const seed = hashCellIds(enabledCellIds);
  const random = createSeededRandom(seed);

  // Downsample buckets proportionally using largest remainder method to avoid rounding losses
  const downsampledCellIds = [];
  const finalSampleSize = Math.min(totalSize, maxCells);

  // Step 1: Calculate base allocations and remainders
  const allocations = buckets.map((bucket) => {
    const proportion = bucket.size / totalSize;
    const ideal = proportion * finalSampleSize;
    const base = Math.floor(ideal);
    const remainder = ideal - base;
    return { bucket, ideal, base, remainder };
  });

  // Step 2: Distribute remainder cells to buckets with largest fractional parts
  let totalAllocated = allocations.reduce((sum, a) => sum + a.base, 0);
  const remainderCells = finalSampleSize - totalAllocated;

  console.log('[getHeatmapCellOrder] finalSampleSize:', finalSampleSize);
  console.log('[getHeatmapCellOrder] totalAllocated (before remainder):', totalAllocated);
  console.log('[getHeatmapCellOrder] remainderCells:', remainderCells);
  console.log('[getHeatmapCellOrder] allocations before remainder:', allocations.map((a) => a.base));

  // Sort by remainder (descending) and allocate extra cells to top buckets
  allocations.sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < remainderCells && i < allocations.length; i += 1) {
    allocations[i].base += 1;
  }

  console.log('[getHeatmapCellOrder] allocations after remainder:', allocations.map((a) => a.base));

  // Step 3: Sample from each bucket according to its allocation
  allocations.forEach(({ bucket, base: sampleSize }) => {
    if (sampleSize > 0) {
      // Deterministic random sample from bucket
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

  console.log('[getHeatmapCellOrder] FINAL downsampledCellIds length:', downsampledCellIds.length);

  return downsampledCellIds;
};

export default getHeatmapCellOrder;
