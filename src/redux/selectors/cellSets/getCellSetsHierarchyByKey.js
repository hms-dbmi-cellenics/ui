import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByKey = (keys = []) => (hierarchy) => (
  hierarchy.filter(
    (child) => keys.includes(child.key),
  )
);

export default createMemoizedSelector(
  getCellSetsHierarchyByKey,
  { inputSelectors: getCellSetsHierarchy() },
);
