import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getCellSetsHierarchy = (type) => (state) => {
  if (!state || state.loading) {
    return [];
  }
  let hierarchy = state.hierarchy.map(
    (cellSet) => (
      {
        key: cellSet.key,
        name: state.properties[cellSet.key]?.name,
        type: state.properties[cellSet.key]?.type,
        children: cellSet?.children || 0,
      }
    ),
  );
  if (type.length) {
    hierarchy = hierarchy.filter(
      (child) => type.includes(child.type),
    );
  }
  return hierarchy;
};

export default createMemoizedSelector(getCellSetsHierarchy);
