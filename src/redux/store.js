/* eslint-disable global-require */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers/index';

const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { composeWithDevTools } = require('redux-devtools-extension');
    const { logger } = require('redux-logger');
    middleware.push(logger);
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return applyMiddleware(...middleware);
};

const getStore = (initialState) => {
  const store = createStore(
    rootReducer,
    initialState,
    bindMiddleware([thunk]),
  );

  // IF REDUCERS WERE CHANGED, RELOAD WITH INITIAL STATE
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const createNextReducer = require('./reducers').default;
      store.replaceReducer(createNextReducer(initialState));
    });
  }

  return store;
};

export default getStore;
