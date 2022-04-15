/* eslint-disable global-require */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createWrapper } from 'next-redux-wrapper';
import { enableMapSet } from 'immer';

import rootReducer from 'redux/reducers/index';

enableMapSet();

const bindMiddleware = (middleware) => {
  const { composeWithDevTools } = require('redux-devtools-extension');

  // eslint-disable-next-line import/no-extraneous-dependencies
  const { createLogger } = require('redux-logger');

  // do not log server-side redux actions
  middleware.push(createLogger({
    predicate: () => typeof window !== 'undefined',
  }));

  return composeWithDevTools(applyMiddleware(...middleware));
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
