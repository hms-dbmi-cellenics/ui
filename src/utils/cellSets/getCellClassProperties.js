import _ from 'lodash';

/**
 * Returns an array of properties of all the cellSets
 * within the cellSetClass that cellId belongs to.
 * @param {string} cellId The id of the cell we are searching for.
 * @param {string} cellSetClassKey The cellSetClass we are searcing inside of
 *  (e.g.: sample, louvain, scratchpad, etc..).
 * @param {string} hierarchy CellSets hierarchy.
 * @param {string} properties CellSets properties.
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
