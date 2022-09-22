const generateVegaHeatmapTracksData = (cellOrder, track, cellSets, showGuardlines) => {
  const { hierarchy, properties } = cellSets;

  const getCellClusterFromCellId = (clusters, cellId) => {
    let cluster;
    clusters.forEach(({ key }) => {
      if (properties[key].cellIds.has(cellId)) {
        cluster = key;
      }
    });
    return cluster;
  };

  // Find the `groupBy` root node.
  const rootNodes = hierarchy.filter((clusters) => clusters.key === track);

  if (!rootNodes.length) {
    return [];
  }

  const childrenCellSets = [];
  rootNodes.forEach((rootNode) => {
    rootNode.children.forEach((cellId) => {
      childrenCellSets.push(cellId);
    });
  });

  const trackColorData = [];
  const groupData = [];
  // Iterate over each child node.

  const clusterSeparationLines = [];
  if (showGuardlines) {
    let currentCluster = getCellClusterFromCellId(childrenCellSets, cellOrder[0]);
    cellOrder.forEach((cell) => {
      const isTheSameCluster = properties[currentCluster]?.cellIds?.has(cell);
      if (!isTheSameCluster) {
        currentCluster = getCellClusterFromCellId(childrenCellSets, cell);
        clusterSeparationLines.push(cell);
      }
    });
  }

  childrenCellSets.forEach(({ key }) => {
    const { cellIds, name, color } = properties[key];

    groupData.push({
      key,
      track,
      name,
      color,
      trackName: properties[track].name,
    });

    const cellOrderSet = new Set(cellOrder);
    const intersectionSet = [...cellIds].filter((x) => cellOrderSet.has(x));

    intersectionSet.forEach((cellId) => trackColorData.push({
      cellId,
      key,
      track,
      color,
    }));
  });
  return { trackColorData, groupData, clusterSeparationLines };
};

export default generateVegaHeatmapTracksData;
