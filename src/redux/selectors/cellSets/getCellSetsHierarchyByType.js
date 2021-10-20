import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByType = (types) => (hierarchy) => (
  hierarchy.filter(
    (child) => types.includes(child.type),
  )
);

export default createMemoizedSelector(
  getCellSetsHierarchyByType,
  { inputSelectors: getCellSetsHierarchy() },
);
