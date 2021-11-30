import { switchExperiment } from 'redux/actions/experiments';
import rootReducer from 'redux/reducers/index';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

const storeState = require('__test__/data/mock_store.json');

describe('switch experiment ', () => {
  it('switches the experiment to its initial values', () => {
    const store = createStore(rootReducer, storeState, applyMiddleware(thunk));
    store.dispatch(switchExperiment());
    expect(store.getState()).toMatchSnapshot();
  });
});
