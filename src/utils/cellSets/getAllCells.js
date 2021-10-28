import defaultCellMapper from './defaultCellMapper';

const getAllCells = (cellSets, groupBy = 'sample', mapper = defaultCellMapper) => {
  // We are using sample as cellSetClass to iterate by default
  // because heuristically it has the least number of entries
  const sampleHierarchy = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === groupBy,
  )?.children || [];

  const sampleNames = sampleHierarchy.map((sample) => sample.key);

  const allCells = sampleNames.reduce((acc, sampleName) => {
    const cellIdsArr = Array.from(cellSets.properties[sampleName].cellIds);
    const sampleCellId = cellIdsArr.map((cellId) => mapper(cellId, sampleName, cellSets));

    return acc.concat(sampleCellId);
  }, []);

  return allCells;
};

export default getAllCells;
