/**
 * Returns the properties of the cellSets that contains the cellId
 * (by the order specified in hierarchy children)
 * @param {int} cellId The id of the cell we are searching for.
 * @param {array} cellSetClassKeys The cellSetClass we are searching inside of
 *  (e.g.: sample, louvain, scratchpad, etc..).
 * @param {object} cellSets  cellSets for the experiment.
 */

const getCellClassProperties = (cellId, cellSetClassKeys, cellSets) => {
  const { properties, hierarchy } = cellSets;
  const cellClassProperties = {};
  const cellIdInt = parseInt(cellId, 10);

  cellSetClassKeys.forEach((rootCluster) => {
    cellClassProperties[rootCluster] = [];
    const childrenCellSets = hierarchy.filter(({ key }) => rootCluster === key)[0]?.children || [];

    childrenCellSets.forEach(({ key }) => {
      if (properties[key].cellIds.has(cellIdInt)) {
        cellClassProperties[rootCluster].push(properties[key]);
      }
    });
  });

  return cellClassProperties;
};

export default getCellClassProperties;
