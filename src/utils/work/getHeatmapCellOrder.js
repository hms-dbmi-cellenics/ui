import seedrandom from 'seedrandom';
import lruMemoize from 'lru-memoize';

// ─── Module-level helpers (not exported) ────────────────────────────────────

const getCellClassIds = (key, hierarchy, properties) => {
  const cellClassNode = hierarchy.find((node) => node.key === key);
  if (!cellClassNode) return new Set();

  const cellIds = new Set();
  cellClassNode.children.forEach((child) => {
    const childCellIds = properties[child.key]?.cellIds || new Set();
    childCellIds.forEach((id) => cellIds.add(id));
  });
  return cellIds;
};

const getCells = (key, isRootNode, filteredCellIds, hierarchy, properties) => {
  const unfilteredCellIds = isRootNode
    ? getCellClassIds(key, hierarchy, properties)
    : (properties[key]?.cellIds || new Set());

  const intersection = new Set();
  unfilteredCellIds.forEach((id) => {
    if (filteredCellIds.has(id)) intersection.add(id);
  });
  return intersection;
};

const getEnabledCellIds = (
  selectedCellSet, normalizedHiddenCellSets, filteredCellIds, hierarchy, properties,
) => {
  const cellIds = getCells(selectedCellSet, true, filteredCellIds, hierarchy, properties);

  normalizedHiddenCellSets.forEach((hiddenKey) => {
    const hiddenCellIds = getCells(hiddenKey, false, filteredCellIds, hierarchy, properties);
    hiddenCellIds.forEach((id) => cellIds.delete(id));
  });

  return cellIds;
};

const getIntersections = (bucket, cellClass, hierarchy, properties) => {
  const cellClassNode = hierarchy.find((node) => node.key === cellClass);
  if (!cellClassNode) return [];

  const intersections = [];

  cellClassNode.children.forEach((child) => {
    const childCellIds = properties[child.key]?.cellIds || new Set();
    const intersection = new Set();

    if (childCellIds.size < bucket.size) {
      childCellIds.forEach((id) => {
        if (bucket.has(id)) intersection.add(id);
      });
    } else {
      bucket.forEach((id) => {
        if (childCellIds.has(id)) intersection.add(id);
      });
    }

    if (intersection.size > 0) intersections.push(intersection);
  });

  return intersections;
};

const cartesianProductIntersection = (buckets, cellClass, hierarchy, properties) => {
  const newBuckets = [];

  buckets.forEach((bucket) => {
    const intersections = getIntersections(bucket, cellClass, hierarchy, properties);

    const leftoverCells = new Set(bucket);
    intersections.forEach((intersection) => {
      intersection.forEach((id) => leftoverCells.delete(id));
    });

    intersections.forEach((intersection) => newBuckets.push(intersection));
    if (leftoverCells.size > 0) newBuckets.push(leftoverCells);
  });

  return newBuckets;
};

const splitByCartesianIntersections = (enabledCellIds, groupedTracks, hierarchy, properties) => {
  let buckets = [enabledCellIds];

  groupedTracks.forEach((cellClass) => {
    buckets = cartesianProductIntersection(buckets, cellClass, hierarchy, properties);
  });

  let totalSize = 0;
  buckets.forEach((bucket) => { totalSize += bucket.size; });

  return { buckets, totalSize };
};

const sampleFromBucket = (bucketArray, sampleSize, random) => {
  const sample = [];
  const bucketCopy = [...bucketArray];

  for (let i = 0; i < sampleSize; i += 1) {
    const randomIndex = Math.floor(random() * bucketCopy.length);
    sample.push(bucketCopy[randomIndex]);
    bucketCopy.splice(randomIndex, 1);
  }

  return sample;
};

const downsampleBuckets = (buckets, totalSize, maxCells, random) => {
  const downsampledCellIds = [];
  const finalSampleSize = Math.min(totalSize, maxCells);

  buckets.forEach((bucket) => {
    const sampleSize = Math.floor((bucket.size / totalSize) * finalSampleSize);
    if (sampleSize > 0) {
      downsampledCellIds.push(...sampleFromBucket(Array.from(bucket), sampleSize, random));
    }
  });

  return downsampledCellIds;
};

// ─── Exported functions ──────────────────────────────────────────────────────

/**
 * Returns cartesian-product buckets without final downsampling.
 *
 * @param {string} selectedCellSet
 * @param {string[]} groupedTracks
 * @param {Set|string[]} hiddenCellSets
 * @param {object} cellSets - Redux cellSets { hierarchy, properties }
 * @returns {{ buckets: Set[], totalSize: number }}
 */
const getBuckets = (selectedCellSet, groupedTracks, hiddenCellSets, cellSets) => {
  if (
    !cellSets?.hierarchy
    || !cellSets?.properties
    || !groupedTracks
    || !selectedCellSet
  ) {
    return { buckets: [], totalSize: 0 };
  }

  const { hierarchy, properties } = cellSets;

  const normalizedHiddenCellSets = hiddenCellSets instanceof Set
    ? Array.from(hiddenCellSets)
    : (hiddenCellSets || []);

  const filteredCellIds = getCellClassIds('louvain', hierarchy, properties);

  const enabledCellIds = getEnabledCellIds(
    selectedCellSet, normalizedHiddenCellSets, filteredCellIds, hierarchy, properties,
  );

  if (groupedTracks.length === 0 || enabledCellIds.size === 0) {
    return { buckets: [], totalSize: 0 };
  }

  return splitByCartesianIntersections(enabledCellIds, groupedTracks, hierarchy, properties);
};

/**
 * Bucketed downsampling second pass: compute display cell IDs after the worker has
 * returned expression data for up to maxCells cells per cartesian-product bucket.
 *
 * Uses full-bucket proportions (no hidden sets) to determine per-bucket sample counts,
 * but restricts actual sampling to cells that are:
 *   (a) not in hiddenCellSets, and
 *   (b) present in workerCellIds (have expression data from the worker).
 *
 * @param {string} selectedCellSet
 * @param {string[]} groupedTracks
 * @param {Set|string[]} hiddenCellSets
 * @param {object} cellSets
 * @param {number[]} workerCellIds - ordered cell IDs returned by the worker
 * @param {number} [maxCells=5000] - maximum number of cells to return after downsampling
 * @returns {number[]} display cell IDs
 */
const computeBucketedDisplayCellIds = (
  selectedCellSet,
  groupedTracks,
  hiddenCellSets,
  cellSets,
  workerCellIds,
  maxCells = 5000,
) => {
  if (!workerCellIds?.length || !cellSets?.hierarchy || !cellSets?.properties) {
    return [];
  }

  const normalizedHiddenCellSets = hiddenCellSets instanceof Set
    ? Array.from(hiddenCellSets)
    : (hiddenCellSets || []);

  // Full buckets (no hidden) to get cartesian-product bucket membership for each cell
  const { buckets: fullBuckets } = getBuckets(
    selectedCellSet, groupedTracks, [], cellSets,
  );

  if (fullBuckets.length === 0) return [];

  const { hierarchy, properties } = cellSets;
  const filteredCellIds = getCellClassIds('louvain', hierarchy, properties);

  // Build hidden cell IDs set (intersected with louvain)
  const hiddenCellIdsSet = new Set();
  normalizedHiddenCellSets.forEach((hiddenKey) => {
    const hiddenIds = properties[hiddenKey]?.cellIds || new Set();
    hiddenIds.forEach((id) => {
      if (filteredCellIds.has(id)) hiddenCellIdsSet.add(id);
    });
  });

  const workerCellIdsSet = new Set(workerCellIds);

  // Deterministic seed encodes inputs that affect which cells are returned by the worker
  const seedString = `bucketed|${selectedCellSet}|${groupedTracks.join(',')}|${normalizedHiddenCellSets.join(',')}|${workerCellIds.length}`;
  const random = seedrandom(seedString);

  // For each bucket: compute effective size (full size minus hidden cells) and eligible pool
  // (worker cells that are not hidden). Proportions use effective sizes so they reflect
  // actual cluster sizes in the dataset, not the capped worker sample counts.
  const bucketData = fullBuckets.map((bucket) => {
    let hiddenCount = 0;
    bucket.forEach((id) => { if (hiddenCellIdsSet.has(id)) hiddenCount += 1; });
    const effectiveSize = bucket.size - hiddenCount;
    const eligible = Array.from(bucket).filter(
      (id) => !hiddenCellIdsSet.has(id) && workerCellIdsSet.has(id),
    );
    return { effectiveSize, eligible };
  });

  const totalEffectiveSize = bucketData.reduce((sum, { effectiveSize }) => sum + effectiveSize, 0);
  if (totalEffectiveSize === 0) return [];

  // Pass 1: guarantee each non-empty bucket a minimum, capped to what's eligible.
  const minCellsBerBucket = Math.max(
    1, Math.round(Math.min(totalEffectiveSize, maxCells) * 0.01),
  );

  const withGuarantee = bucketData.map(({ effectiveSize, eligible }) => ({
    effectiveSize,
    eligible,
    guaranteed: Math.min(minCellsBerBucket, eligible.length),
  }));

  const totalGuaranteed = withGuarantee.reduce((sum, { guaranteed }) => sum + guaranteed, 0);
  const remainingQuota = Math.max(0, maxCells - totalGuaranteed);

  // Pass 2: distribute remaining quota proportionally by effectiveSize among buckets
  // that have eligible cells beyond their guarantee.
  const totalExcessEffectiveSize = withGuarantee.reduce(
    (sum, { effectiveSize, eligible, guaranteed }) => (
      eligible.length > guaranteed ? sum + effectiveSize : sum
    ),
    0,
  );

  const displayCellIds = [];

  withGuarantee.forEach(({ effectiveSize, eligible, guaranteed }) => {
    if (eligible.length === 0) return;
    let extra = 0;
    if (eligible.length > guaranteed && totalExcessEffectiveSize > 0) {
      extra = Math.floor((effectiveSize / totalExcessEffectiveSize) * remainingQuota);
    }
    const sampleCount = Math.min(guaranteed + extra, eligible.length);
    if (sampleCount === 0) return;
    displayCellIds.push(...sampleFromBucket(eligible, sampleCount, random));
  });

  return displayCellIds;
};

/**
 * Compute which cell sets should be hidden based on user selections.
 */
const computeHiddenCellSets = (selectedPoints, cellSets) => {
  let hiddenCellSets = Array.from(cellSets.hidden || []);

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
            hiddenCellSets = hiddenCellSets.filter((key) => key !== child.key);
          }
        });
      }
    }
  }

  return hiddenCellSets;
};

/**
 * Downsamples cell order for marker heatmap.
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

  const normalizedHiddenCellSets = hiddenCellSets instanceof Set
    ? Array.from(hiddenCellSets)
    : (hiddenCellSets || []);

  const seedString = [
    selectedCellSet,
    groupedTracks.join(','),
    normalizedHiddenCellSets.join(','),
  ].join('|');
  const random = seedrandom(seedString);

  const { buckets, totalSize } = getBuckets(
    selectedCellSet, groupedTracks, hiddenCellSets, cellSets,
  );

  if (buckets.length === 0 || totalSize === 0) return [];

  return downsampleBuckets(buckets, totalSize, maxCells, random);
};

const memoizedGetHeatmapCellOrder = lruMemoize(10)(getHeatmapCellOrder);

export { computeHiddenCellSets, getBuckets, computeBucketedDisplayCellIds };
export default memoizedGetHeatmapCellOrder;
