import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import getCellSets from 'redux/selectors/cellSets/getCellSets';

const getCellSetsData = (children, properties) => (
  children.map(({ key }) => {
    const { name } = properties[key];
    return { key, name };
  })
);

const getCellSetsHierarchy = () => (state) => {
  if (!state || !state.accessible) {
    return [];
  }

  const hierarchy = state.hierarchy.map(
    (cellClass) => (
      {
        key: cellClass.key,
        name: state.properties[cellClass.key]?.name,
        type: state.properties[cellClass.key]?.type,
        children: getCellSetsData(cellClass?.children ?? [], state.properties),
      }
    ),
  );

  return hierarchy;
};

export default createMemoizedSelector(
  getCellSetsHierarchy,
  { inputSelectors: getCellSets() },
);
