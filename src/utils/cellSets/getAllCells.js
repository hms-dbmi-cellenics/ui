import defaultCellMapper from './defaultCellMapper';

const DEFAULT_CELL_SET_CLASS = 'sample';

const getAllCells = (cellSets, mapper = defaultCellMapper) => {
  // We are using sample by default because heuristically it has the least number of entries
  const sampleHierarchy = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === DEFAULT_CELL_SET_CLASS,
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
