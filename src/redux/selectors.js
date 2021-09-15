// Based on https://cmichel.io/redux-selectors-structure

/**
 * Accumulates all the different selectors
 */
import * as backendStatusSelectors from './selectors/backendStatus';

const selectors = {};

Object.keys(backendStatusSelectors).forEach(
  (funcName) => {
    selectors[funcName] = (...params) => (state) => (
      backendStatusSelectors[funcName](...params)(state.backendStatus)
    );
  },
);

module.exports = selectors;
