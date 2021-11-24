import { switchExperiment } from 'redux/actions/experiments';
import rootReducer from 'redux/reducers/index';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import cellSetsInitialState from 'redux/reducers/cellSets/initialState';
import experimentsInitialState from 'redux/reducers/experiments/initialState';

const storeState = require('__test__/data/mock_store.json');

describe('switch experiment ', () => {
  it('switches the experiment to its initial values', () => {
    const store = createStore(rootReducer, storeState, applyMiddleware(thunk));
    store.dispatch(switchExperiment());
    expect(store.getState().backendStatus).toEqual(storeState.backendStatus);
    expect(store.getState().experimentSettings).toEqual(storeState.experimentSettings);
    expect(store.getState().samples).toEqual(storeState.samples);
    expect(store.getState().projects).toEqual(storeState.projects);
    expect(store.getState().cellSets).toEqual(cellSetsInitialState);
    expect(store.getState().experiments).toEqual(experimentsInitialState);
  });
});
