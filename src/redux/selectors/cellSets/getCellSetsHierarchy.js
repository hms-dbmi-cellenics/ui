import _ from 'lodash';
import { createSelector } from 'reselect';

const cellSetsSelector = (cellSets) => cellSets;

const getCellSetsHierarchy = (type) => (cellSets) => {
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
  if (type.length) {
    hierarchy = hierarchy.filter(
      (child) => type.includes(child.type),
    );
  }
  return hierarchy;
};

const getCellSetsHierarchyMemoized = (type = []) => createSelector(
  cellSetsSelector,
  getCellSetsHierarchy(type),
);

export default _.memoize(getCellSetsHierarchyMemoized);
