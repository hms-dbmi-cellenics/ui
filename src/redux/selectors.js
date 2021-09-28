/* eslint-disable import/prefer-default-export */

// Accumulates all the different selectors

import * as backendSelectors from './selectors/backendStatus';

const getBackendStatus = (...params) => (state) => (
  backendSelectors.getBackendStatus(...params)(state.backendStatus));

export {
  getBackendStatus,
};
