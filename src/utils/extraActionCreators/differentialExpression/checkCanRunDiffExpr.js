import { ComparisonType } from 'components/data-exploration/differential-expression-tool/DiffExprCompute';
import { getCellSetKey, getCellSetClassKey } from 'utils/cellSets';

const MIN_NUM_CELLS_IN_GROUP = 10;
const NUM_SAMPLES_SHOW_ERROR = 1;
const NUM_SAMPLES_SHOW_WARNING = 2;

let lastSampleCellIdSets = null;
let lastCellIdToSampleMap = null;

// Building the mapping is O(number of cells), so it is cached between calls.
// The cache is keyed on the identity of the samples' cellIds themselves: immer
// keeps untouched cell sets referentially equal, so unrelated edits (renaming,
// recoloring) reuse the mapping, while cell sets being reloaded (a reprocess,
// a re-upload) rebuild it. Keying on the number of samples instead would hand
// back a mapping built from a different experiment's cell ids.
const mapCellIdToSample = (sampleKeys, properties) => {
  const sampleCellIdSets = sampleKeys.map((key) => properties[key]?.cellIds);

  const isCached = lastSampleCellIdSets?.length === sampleCellIdSets.length
    && sampleCellIdSets.every((cellIds, idx) => cellIds === lastSampleCellIdSets[idx]);

  if (isCached) return lastCellIdToSampleMap;

  const mapping = [];
  sampleCellIdSets.forEach((cellIds, idx) => {
    if (!cellIds) return;

    cellIds.forEach((cellId) => { mapping[cellId] = idx; });
  });

  lastSampleCellIdSets = sampleCellIdSets;
  lastCellIdToSampleMap = mapping;

  return mapping;
};

const getSampleKeys = (hierarchy) => hierarchy?.find(
  (rootNode) => (rootNode.key === 'sample'),
)?.children?.map((sample) => sample.key) ?? [];

const checkCanRunDiffExpr = (
  properties,
  hierarchy,
  comparisonGroup,
  selectedComparison,
) => {
  // we only need to check cell availability for comparisons which are not 'within'
  if (selectedComparison === ComparisonType.WITHIN) {
    return canRunDiffExprResults.TRUE;
  }

  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};

  const sampleKeys = getSampleKeys(hierarchy);
  const cellIdToSampleMap = mapCellIdToSample(sampleKeys, properties);

  if (!basis
    || !cellSet
    || !compareWith
    || cellIdToSampleMap.length === 0
  ) {
    return canRunDiffExprResults.FALSE;
  }
  const basisCellSetKey = getCellSetKey(basis);
  const cellSetKey = getCellSetKey(cellSet);
  const compareWithKey = getCellSetKey(compareWith);

  let basisCellIds = [];
  if (basisCellSetKey === 'all') {
    const allCellIds = sampleKeys.reduce((cumulativeCellIds, key) => {
      const { cellIds } = properties[key];
      return cumulativeCellIds.concat(Array.from(cellIds));
    }, []);
    basisCellIds = new Set(allCellIds);
  } else {
    // The selections live in redux and can outlive the cell sets they point at,
    // e.g. if the cell sets were reloaded (reprocess, re-upload) or the cell
    // class was deleted. Such a comparison can't be run.
    if (!properties[basisCellSetKey]) return canRunDiffExprResults.FALSE;

    basisCellIds = properties[basisCellSetKey].cellIds;
  }

  if (!properties[cellSetKey]) return canRunDiffExprResults.FALSE;

  const cellSetCellIds = Array.from(properties[cellSetKey].cellIds);

  let compareWithCellIds = [];
  if (['rest', 'background'].includes(compareWithKey)) {
    const parentKey = getCellSetClassKey(cellSet);

    const otherGroupKeys = hierarchy.find((obj) => obj.key === parentKey)
      ?.children.filter((child) => child.key !== cellSetKey) ?? [];

    compareWithCellIds = otherGroupKeys.reduce(
      (cumulativeGroupKeys, child) => cumulativeGroupKeys.concat(
        Array.from(properties[child.key].cellIds),
      ), [],
    );
  } else {
    if (!properties[compareWithKey]) return canRunDiffExprResults.FALSE;

    compareWithCellIds = Array.from(properties[compareWithKey].cellIds);
  }

  // Intersect the basis cell set with each group cell set
  const filteredCellSetCellIds = cellSetCellIds.filter((cellId) => basisCellIds.has(cellId));
  const filteredCompareWithCellIds = compareWithCellIds.filter(
    (cellId) => basisCellIds.has(cellId),
  );

  const numSampleWithEnoughCells = (filteredCellSet) => {
    // Prepare an array of length sampleIds to hold the number of cells for each sample
    const numCellsPerSampleInCellSet = new Array(sampleKeys.length).fill(0);

    // Count the number of cells in each sample and assign them into numCellsPerSampleInCellSet
    filteredCellSet
      .forEach((cellId) => {
        const sampleIdx = cellIdToSampleMap[cellId];
        numCellsPerSampleInCellSet[sampleIdx] += 1;
      });

    return numCellsPerSampleInCellSet.filter(
      (numCells) => numCells >= MIN_NUM_CELLS_IN_GROUP,
    ).length;
  };

  const numCellSetSampleWithEnoughCells = numSampleWithEnoughCells(filteredCellSetCellIds);
  const numCompareWithSampleWithEnoughCells = numSampleWithEnoughCells(filteredCompareWithCellIds);

  if (
    numCellSetSampleWithEnoughCells === 0
    || numCompareWithSampleWithEnoughCells === 0
  ) return canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR;

  const sumComparedSamples = numCellSetSampleWithEnoughCells + numCompareWithSampleWithEnoughCells;

  if (
    sumComparedSamples <= NUM_SAMPLES_SHOW_ERROR
  ) return canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR;
  if (
    sumComparedSamples <= NUM_SAMPLES_SHOW_WARNING
  ) return canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING;

  return canRunDiffExprResults.TRUE;
};

const canRunDiffExprResults = {
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  INSUFFICIENT_CELLS_WARNING: 'INSUFFICIENT_CELLS_WARNING',
  INSUFFCIENT_CELLS_ERROR: 'INSUFFCIENT_CELLS_ERROR',
};

export default checkCanRunDiffExpr;
export { canRunDiffExprResults };
