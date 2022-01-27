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

const getCellClassProperties = (cellId, cellSetClassKey, cellSets) => {
  const { properties, hierarchy } = cellSets;
  console.log('cell colour ', cellSetClassKey, cellSets);

  let childrenCellSets = hierarchy.filter(({ key }) => cellSetClassKey.includes(key))
    .reduce((prev, curr) => prev.children.concat(curr.children)).children;
  console.log('yaaaaay', childrenCellSets);
  const cellSetsContainingCell = [];
  childrenCellSets = _.isArray(childrenCellSets) ? childrenCellSets : [childrenCellSets];

  childrenCellSets.forEach(({ key }) => {
    if (properties[key].cellIds.has(cellId)) {
      cellSetsContainingCell.push(key);
    }
  });
  // console.log('CONTAINING CELLSET')
  const clusterProperties = cellSetsContainingCell.map((clusterKey) => {
    const rootClusterName = hierarchy.filter(({ children }) => children.filter((child) => child.key === clusterKey).length > 0)[0].key;
    console.log(properties[clusterKey], 'hi :))');
    return { ...properties[clusterKey], rootClusterName: _.capitalize(rootClusterName) };
  });
  console.log('childrenCellSets2', clusterProperties);

  return clusterProperties;
};

export default getCellClassProperties;
