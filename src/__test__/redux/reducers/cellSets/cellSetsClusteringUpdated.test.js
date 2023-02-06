import cellSetsClusteringUpdatedReducer from 'redux/reducers/cellSets/cellSetsClusteringUpdated';
import initialState from 'redux/reducers/cellSets/initialState';

describe('cellSetsClusteringUpdated', () => {
  it('Sets loading and error indicators appropriately', () => {
    const action = { payload: {} };

    const newState = cellSetsClusteringUpdatedReducer({
      ...initialState, loading: true, error: false, updatingClustering: true,
    }, action);

    // New data is in the new state and loading and updatingClustering are false
    expect(newState).toMatchSnapshot();
  });
});
