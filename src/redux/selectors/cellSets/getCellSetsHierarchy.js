import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import initialState from '../../reducers/cellSets/initialState';

const getCellSetsData = (children, properties) => (
  children.map(({ key }) => {
    const { name } = properties[key];
    return { key, name };
  })
);

// Depend only on `hierarchy` + `properties` (and the accessible flag), NOT on
// the whole cellSets slice. `hidden`/`selected` change on every eye-toggle and
// checkbox tick, but immer keeps `hierarchy`/`properties` referentially stable
// across those. Previously this chained off getCellSets(), which returns a new
// object on every cellSets change, so a hide or select recomputed this — and,
// via getCellSetsHierarchyByType, every downstream consumer (SpatialViewer's
// cellsInAnyCluster O(all cells) rebuild, the colour LUTs, the embedding, …).
const getCellSetsHierarchy = () => (accessible, hierarchy, properties) => {
  if (!accessible) return [];

  return hierarchy.map((cellClass) => ({
    key: cellClass.key,
    name: properties[cellClass.key]?.name,
    type: properties[cellClass.key]?.type,
    children: getCellSetsData(cellClass?.children ?? [], properties),
  }));
};

const withFallback = (state) => (Object.keys(state).length ? state : initialState);

const selectAccessible = (state) => {
  const s = withFallback(state);
  return !s.loading && !s.initialLoadPending && !s.updatingClustering && !s.error;
};

export default createMemoizedSelector(
  getCellSetsHierarchy,
  {
    inputSelectors: [
      selectAccessible,
      (state) => withFallback(state).hierarchy,
      (state) => withFallback(state).properties,
    ],
  },
);
