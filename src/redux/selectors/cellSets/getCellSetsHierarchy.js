import { createSelector } from 'reselect';
import memoize from 'lru-memoize';

import _ from 'lodash';

const combiner = (type) => (state) => {
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

const makeGetCellSetsHierarchy = (type = []) => createSelector(
  (state) => state,
  combiner(type),
);

// Based on https://www.aarongreenwald.com/blog/redux-reselect-parameters
export default memoize(1, _.isEqual)(makeGetCellSetsHierarchy);
