import defaultCellMapper from './defaultCellMapper';

const getSampleCells = (cellSets, sampleKey, mapper = defaultCellMapper) => {
  const cellIds = Array.from(cellSets.properties[sampleKey].cellIds);

  return cellIds.map(
    (cellId) => mapper(cellId, sampleKey, cellSets),
  );
};

export default getSampleCells;
