/* eslint-disable global-require */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createWrapper } from 'next-redux-wrapper';
import { enableMapSet } from 'immer';

import rootReducer from 'redux/reducers/index';

enableMapSet();

// The cellSets state holds a `cellIds` integer array per cell set, totalling
// millions of entries for large experiments. Redux DevTools (which snapshots
// state after every action for time-travel) and redux-logger would otherwise
// serialize all of them on every single action, making cheap operations like
// rename/delete/select lag for seconds. Replace the arrays with a compact
// placeholder before they are handed to the dev tools. This is O(number of
// cell sets) and never touches the real store state.
const sanitizeCellSetsState = (state) => {
  const properties = state?.cellSets?.properties;
  if (!properties) return state;

  const sanitizedProperties = {};
  Object.keys(properties).forEach((key) => {
    const property = properties[key];
    sanitizedProperties[key] = property?.cellIds
      ? { ...property, cellIds: `[${property.cellIds.length} cellIds]` }
      : property;
  });

  return {
    ...state,
    cellSets: { ...state.cellSets, properties: sanitizedProperties },
  };
};

const bindMiddleware = (middleware) => {
  const { composeWithDevTools } = require('redux-devtools-extension');

  // eslint-disable-next-line import/no-extraneous-dependencies
  const { createLogger } = require('redux-logger');

  // do not log server-side redux actions
  middleware.push(createLogger({
    predicate: () => typeof window !== 'undefined',
    stateTransformer: sanitizeCellSetsState,
  }));

  return composeWithDevTools({
    stateSanitizer: sanitizeCellSetsState,
  })(applyMiddleware(...middleware));
};

const makeStore = () => {
  const store = createStore(
    rootReducer,
    bindMiddleware([thunk]),
  );

  // IF REDUCERS WERE CHANGED, RELOAD WITH INITIAL STATE
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const createNextReducer = require('./reducers').default;
      store.replaceReducer(createNextReducer(rootReducer));
    });
  }
  return store;
};

const wrapper = createWrapper(makeStore, { debug: false });
export { wrapper, makeStore };
