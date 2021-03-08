import cellSetsClusteringUpdatedReducer from '../../../../redux/reducers/cellSets/cellSetsClusteringUpdated';
import initialState from '../../../../redux/reducers/cellSets/initialState';

const child0 = {
  cellIds: [0, 1, 2], color: '', key: 'louvain-0', name: 'Cluster 0', rootNode: false, type: 'cellSets',
};

const child1 = {
  cellIds: [3, 4, 6], color: '', key: 'louvain-1', name: 'Cluster 1', rootNode: false, type: 'cellSets',
};

const mockedData = (childrenInput) => ({
  children: childrenInput,
  key: 'louvain',
  name: 'Louvain clusters',
  rootNode: true,
  type: 'cellSets',
});

describe('cellMeta', () => {
  it('Updates empty state with new data', () => {
    const action = { payload: { data: [mockedData([child0, child1])] } };

    const newState = cellSetsClusteringUpdatedReducer(initialState, action);

    // New data is in the new state and loading and updatingClustering are false
    expect(newState).toMatchSnapshot();
  });

  it('Updates state with new data without removing preexisting state', () => {
    const action = { payload: { data: [mockedData([child0, child1])] } };

    const mockedHierarchy = [{ key: 'scratchpad', children: [] }];
    const mockedProperties = {
      scratchpad: {
        cellIds: new Set(), name: 'Scratchpad', rootNode: true, type: 'cellSets',
      },
    };

    const mockedState = {
      ...initialState,
      hierarchy: mockedHierarchy,
      properties: mockedProperties,
    };

    const newState = cellSetsClusteringUpdatedReducer(mockedState, action);

    // New data is in the new state and old data too (it wasn't overwritten)
    expect(newState).toMatchSnapshot();
  });
});
