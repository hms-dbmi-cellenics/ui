import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByKeys = (keys) => (hierarchy) => (
  hierarchy.filter(
    (child) => keys.includes(child.key),
  )
);

export default createMemoizedSelector(
  getCellSetsHierarchyByKeys,
  { inputSelectors: getCellSetsHierarchy() },
);
