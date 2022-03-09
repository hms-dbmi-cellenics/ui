const MIN_NUM_CELLS_IN_GROUP = 10;
const NUM_SAMPLES_SHOW_ERROR = 1;
const NUM_SAMPLES_SHOW_WARNING = 2;

const getCellSetKey = (name) => (name?.split('/')[1] || name);
const getRootKey = (name) => name?.split('/')[0];

const checkCanRunDiffExpr = (
  properties,
  hierarchy,
  numSamples,
  sampleKeys,
  cellIdToSampleMap,
  comparisonGroup,
  selectedComparison,
  ComparisonType,
) => {
  if (selectedComparison === ComparisonType.WITHIN) return canRunDiffExprResults.TRUE;

  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};

  if (!basis
    || !cellSet
    || !compareWith
    || !cellIdToSampleMap.length > 0
  ) { return canRunDiffExprResults.FALSE; }

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
    basisCellIds = properties[basisCellSetKey].cellIds;
  }

  const cellSetCellIds = Array.from(properties[cellSetKey].cellIds);

  let compareWithCellIds = [];
  if (['rest', 'background'].includes(compareWithKey)) {
    const parentKey = getRootKey(cellSet);

    const otherGroupKeys = hierarchy.find((obj) => obj.key === parentKey)
      .children.filter((child) => child.key !== cellSetKey);

    compareWithCellIds = otherGroupKeys.reduce(
      (cumulativeGroupKeys, child) => cumulativeGroupKeys.concat(
        Array.from(properties[child.key].cellIds),
      ), [],
    );
  } else {
    compareWithCellIds = Array.from(properties[compareWithKey].cellIds);
  }

  // Intersect the basis cell set with each group cell set
  const filteredCellSetCellIds = cellSetCellIds.filter((cellId) => basisCellIds.has(cellId));
  const filteredCompareWithCellIds = compareWithCellIds.filter(
    (cellId) => basisCellIds.has(cellId),
  );

  const numSampleWithEnoughCells = (filteredCellSet) => {
    // Prepare an array of length sampleIds to hold the number of cells for each sample
    const numCellsPerSampleInCellSet = new Array(numSamples).fill(0);

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
