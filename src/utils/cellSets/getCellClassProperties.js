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

  const cellSetsContainingCell = [];

  childrenCellSets.forEach(({ key }) => {
    if (properties[key].cellIds.has(cellId)) {
      cellSetsContainingCell.push(key);
    }
  });

  return cellSetsContainingCell.map((cellSetKey) => properties[cellSetKey]);
};

export default getCellClassProperties;
