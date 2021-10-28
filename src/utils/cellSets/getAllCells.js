const getAllCells = (cellSets, groupBy = 'sample') => {
  // We are using sample as cellSetClass to iterate by default
  // because heuristically it has the least number of entries
  const sampleHierarchy = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === groupBy,
  )?.children || [];

  const sampleKeys = sampleHierarchy.map((sample) => sample.key);

  const allCells = sampleKeys.reduce((acc, sampleKey) => {
    const cellIdsArr = Array.from(cellSets.properties[sampleKey].cellIds);
    const sampleCellId = cellIdsArr.map((cellId) => ({
      cellId,
      cellSetKey: sampleKey,
    }));

    return acc.concat(sampleCellId);
  }, []);

  return allCells;
};

export default getAllCells;
