const getCellSetsHierarchy = (type = [], searchBy = 'type') => (state) => {
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
      (child) => type.includes(child[searchBy]),
    );
  }
  return hierarchy;
};
export default getCellSetsHierarchy;
