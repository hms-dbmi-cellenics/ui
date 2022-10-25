import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByKeys = (keys) => (hierarchy) => (
  keys.map((key) => hierarchy.find((child) => child.key === key))
);

export default createMemoizedSelector(
  getCellSetsHierarchyByKeys,
  { inputSelectors: getCellSetsHierarchy() },
);
