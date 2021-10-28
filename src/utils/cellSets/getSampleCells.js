const getSampleCells = (cellSets, sampleKey) => {
  const cellIds = Array.from(cellSets.properties[sampleKey].cellIds);

  return cellIds.map((cellId) => ({
    cellId,
    cellSetKey: sampleKey,
  }));
};

export default getSampleCells;
