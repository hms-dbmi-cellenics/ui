import _ from 'lodash';

const getCellClassProperties = (cellId, cellSetClassKey, hierarchy, properties) => {
  const childrenCellSets = _.find(hierarchy, ({ key }) => key === cellSetClassKey).children;

  console.log('childrenCellSetsDewbug');
  console.log(childrenCellSets);

  console.log('cellSetClassKeyDebug');
  console.log(cellSetClassKey);

  let cellSet;
  childrenCellSets.forEach(({ key }) => {
    console.log('cellIdDebug');
    console.log(cellId);
    console.log(properties[key].cellIds);

    // console.log(properties[key].cellIds.has());

    if (properties[key].cellIds.has(cellId)) {
      console.log('entredebug');
      cellSet = key;
    }
  });

  console.log('cellSetDebug');
  console.log(cellSet);

  return properties[cellSet];
};

export default getCellClassProperties;
