/* eslint-disable global-require */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { createWrapper } from 'next-redux-wrapper';
import fetch from 'better-fetch';
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

// default headers added for each api request
fetch.setDefaultHeaders({
  Authorization: 'Bearer admin',
});

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

const wrapper = createWrapper(getStore, { debug: true });

export default wrapper;
