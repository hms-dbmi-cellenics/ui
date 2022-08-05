import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getCellSetsHierarchy = () => (state) => {
  if (!state || state.initialLoadPending) {
    return [];
  }

  const hierarchy = state.hierarchy.map(
    (cellSet) => (
      {
        key: cellSet.key,
        name: state.properties[cellSet.key]?.name,
        type: state.properties[cellSet.key]?.type,
        children: cellSet?.children || [],
      }
    ),
  );
  return hierarchy;
};

export default createMemoizedSelector(getCellSetsHierarchy);
