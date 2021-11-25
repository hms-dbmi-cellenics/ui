import _ from 'lodash';

const getCellClassProperties = (cellId, cellSetClassKey, hierarchy, properties) => {
  const childrenCellSets = _.find(hierarchy, ({ key }) => key === cellSetClassKey).children;

  let cellSet;
  childrenCellSets.forEach(({ key }) => {
    if (properties[key].cellIds.has(cellId)) {
      cellSet = key;
    }
  });

  return properties[cellSet];
};

export default getCellClassProperties;
