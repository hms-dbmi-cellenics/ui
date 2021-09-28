/* eslint-disable import/prefer-default-export */

// Accumulates all the different selectors

import * as backendSelectors from './selectors/backendStatus';
import * as cellSetsSelectors from './selectors/cellSets';

const getBackendStatus = (...params) => (state) => (
  backendSelectors.getBackendStatus(...params)(state.backendStatus));

const getCellSets = (...params) => (state) => {
  console.log('inside selector');
  return cellSetsSelectors.getCellSets(...params)(state.cellSets);
};

export {
  getBackendStatus,
  getCellSets,
};
