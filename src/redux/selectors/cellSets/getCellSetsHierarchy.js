const getCellSetsHierarchy = (cellSets, category = []) => {
  if (!cellSets || cellSets.loading) {
    return [];
  }
  let hierarchy = cellSets.hierarchy.map(
    (cellSet) => (
      {
        key: cellSet.key,
        name: cellSets.properties[cellSet.key]?.name,
        type: cellSets.properties[cellSet.key]?.type,
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
