/**
 * Returns the properties of the cellSets that contains the cellId
 * (by the order specified in hierarchy children)
 * @param {int} cellId The id of the cell we are searching for.
 * @param {array} cellSetClassKeys The cellSetClass we are searching inside of
 *  (e.g.: sample, louvain, scratchpad, etc..).
 * @param {object} cellSets  cellSets for the experiment.
 *
 * @returns {object} The properties of the cellSets that contain the cellId
 */

const getContainingCellSetsProperties = (cellId, cellSetClassKeys, cellSets) => {
  const { properties, hierarchy } = cellSets;
  const cellClassProperties = {};

  cellSetClassKeys.forEach((rootNode) => {
    cellClassProperties[rootNode] = [];
    const childrenCellSets = hierarchy.filter(({ key }) => rootNode === key)[0]?.children || [];

    childrenCellSets.forEach(({ key }) => {
      if (properties[key].cellIds.has(cellId)) {
        cellClassProperties[rootNode].push(properties[key]);
      }
    });
  });

  return cellClassProperties;
};

export default getContainingCellSetsProperties;
