import { createSelector } from 'reselect';
import memoize from 'lru-memoize';

import _ from 'lodash';

const cellSetsSelector = (cellSets) => cellSets;

const outputGetCellSetsHierarchy = (type) => (cellSets) => {
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

const createGetCellSetsHierarchy = (type = []) => createSelector(
  cellSetsSelector,
  outputGetCellSetsHierarchy(type),
);

export default memoize(1, _.isEqual)(createGetCellSetsHierarchy);
