import _ from 'lodash';

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

  let childrenCellSets = hierarchy.filter(({ key }) => cellSetClassKeys.includes(key))
    .reduce((prev, curr) => prev.children.concat(curr.children));
  const cellSetsContainingCell = [];
  childrenCellSets = _.isArray(childrenCellSets) ? childrenCellSets : childrenCellSets.children;

  childrenCellSets.forEach(({ key }) => {
    if (properties[key].cellIds.has(parseInt(cellId, 10))) {
      cellSetsContainingCell.push(key);
    }
  });

  const clusterProperties = cellSetsContainingCell.map((clusterKey) => {
    const rootClusterName = hierarchy.filter(({ children }) => (
      children.filter((child) => child.key === clusterKey).length > 0))[0].key;
    return {
      ...properties[clusterKey],
      clusterName: `${_.capitalize(rootClusterName)} : ${properties[clusterKey].name}`,
    };
  });

  return clusterProperties;
};

export default getCellClassProperties;
