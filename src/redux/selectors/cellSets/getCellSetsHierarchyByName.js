import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getCellSetsHierarchyByName = (name) => (cellSets) => {
  const { properties, hierarchy } = cellSets;

  const rootCluster = Object.keys(properties).filter((key) => (
    properties[key].name === name
  ));
  console.log('TOOOSAODASDA ', rootCluster);
  const hierarchyToReturn = Object.values(hierarchy).filter(
    (currCluster) => currCluster.key === rootCluster[0],
  );
  return hierarchyToReturn;
};

export default createMemoizedSelector(getCellSetsHierarchyByName);
