const getSampleCells = (cellSets, sampleKey) => {
  if (!(sampleKey in cellSets.properties)) {
    return [];
  }

  const cellIds = Array.from(cellSets.properties[sampleKey].cellIds);

  return cellIds.map((cellId) => ({
    cellId,
    cellSetKey: sampleKey,
  }));
};

export default getSampleCells;
