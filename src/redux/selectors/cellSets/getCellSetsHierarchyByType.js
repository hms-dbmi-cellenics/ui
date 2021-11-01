import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSetsHierarchy from './getCellSetsHierarchy';

const getCellSetsHierarchyByType = (type) => (hierarchy) => (
  hierarchy.filter(
    (child) => child.type === type,
  )
);

export default createMemoizedSelector(
  getCellSetsHierarchyByType,
  { inputSelectors: getCellSetsHierarchy() },
);
