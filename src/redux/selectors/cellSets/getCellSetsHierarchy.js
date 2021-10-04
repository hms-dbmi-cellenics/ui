const getCellSetsHierarchy = (category = []) => (state) => {
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
  if (category.length) {
    hierarchy = hierarchy.filter(
      ({ type }) => category.includes(type),
    );
  }
  return hierarchy;
};
export default getCellSetsHierarchy;
