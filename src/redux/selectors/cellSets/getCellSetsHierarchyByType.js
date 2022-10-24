import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByType = (type, keyExceptions = []) => (hierarchy) => (
  hierarchy.filter(
    (child) => child.type === type && !keyExceptions.includes(child.key),
  )
);

export default createMemoizedSelector(
  getCellSetsHierarchyByType,
  { inputSelectors: getCellSetsHierarchy() },
);
