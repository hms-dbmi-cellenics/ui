const getAllCells = (cellSets, cellSetClass = 'sample') => {
  // We are using sample by default because heuristically it has the least number of entries
  const sampleHierarchy = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === cellSetClass,
  )?.children || [];

  const sampleNames = sampleHierarchy.map((sample) => sample.key);

  const allCellIds = sampleNames.reduce((acc, sampleName) => {
    const cellIdsArr = Array.from(cellSets.properties[sampleName].cellIds);
    const sampleCellId = cellIdsArr.map((cellId) => ({
      cellId,
      cellSetKey: sampleName,
    }));

    return acc.concat(sampleCellId);
  }, []);

  return allCellIds;
};

export default getAllCells;
