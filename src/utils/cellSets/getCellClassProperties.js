import _ from 'lodash';

/**
 * Returns the properties of the first of the cellSets that contains the cellId
 * (by the order specified in hierarchy children)
 * @param {int} cellId The id of the cell we are searching for.
 * @param {string} cellSetClassKey The cellSetClass we are searcing inside of
 *  (e.g.: sample, louvain, scratchpad, etc..).
 * @param {array} hierarchy CellSets hierarchy.
 * @param {object} properties CellSets properties.
 */

const getCellClassProperties = (cellId, cellSetClassKey, hierarchy, properties) => {
  const childrenCellSets = _.find(hierarchy, ({ key }) => key === cellSetClassKey).children;

  let firstCellSetContainingCell = null;

  childrenCellSets.every(({ key }) => {
    if (properties[key].cellIds.has(cellId)) {
      firstCellSetContainingCell = key;

      // Break out of the loop
      return false;
    }

    // Continue looping
    return true;
  });

  return properties[firstCellSetContainingCell];
};

export default getCellClassProperties;
