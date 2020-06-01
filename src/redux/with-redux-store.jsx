/* eslint-disable no-underscore-dangle */
import React, { Component } from 'react';
import initializeStore from './store';

const __NEXT_REDUX_STORE__ = '__NEXT_REDUX_STORE__';

const getOrCreateStore = (initialState) => {
  // Always make a new store if server, otherwise state is shared between requests
  if (typeof window === 'undefined') {
    return initializeStore(initialState);
  }

  // Create store if unavailable on the client and set it on the window object
  if (!window[__NEXT_REDUX_STORE__]) {
    window[__NEXT_REDUX_STORE__] = initializeStore(initialState);
  }
  return window[__NEXT_REDUX_STORE__];
};

const withReduxStore = (App) => class AppWithRedux extends Component {
  static async getInitialProps(appContext) {
    // Get or Create the store with `undefined` as initialState
    // This allows you to set a custom default initialState
    const store = getOrCreateStore();

    // Provide the store to getInitialProps of pages
    // eslint-disable-next-line no-param-reassign
    appContext.ctx.store = store;

    return {
      ...(App.getInitialProps ? await App.getInitialProps(appContext) : {}),
      initialReduxState: store.getState(),
    };
  }

  render() {
    // eslint-disable-next-line react/prop-types
    const { initialReduxState } = this.props;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <App {...this.props} store={getOrCreateStore(initialReduxState)} />;
  }
};

export default withReduxStore;
