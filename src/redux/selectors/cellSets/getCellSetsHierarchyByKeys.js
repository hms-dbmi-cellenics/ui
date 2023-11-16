import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByKeys = (keys) => (hierarchy) => {
  if (hierarchy.length === 0) return [];

  return (
    keys.map((key) => hierarchy.find((child) => child.key === key))
  );
};

export default createMemoizedSelector(
  getCellSetsHierarchyByKeys,
  { inputSelectors: getCellSetsHierarchy() },
);
