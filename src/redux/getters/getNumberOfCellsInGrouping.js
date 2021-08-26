import _ from 'lodash';

const getNumberOfCellsInGrouping = (rootNodeKey, state) => {
  const { hierarchy, properties } = state.cellSets;

  const rootNode = hierarchy.find(({ key }) => key === rootNodeKey);

  if (!rootNode) return null;

  const cellSetsLengths = rootNode?.children.map(
    ({ key: cellSetKey }) => properties[cellSetKey].cellIds.size,
  );

  return _.sum(cellSetsLengths);
};

export default getNumberOfCellsInGrouping;
