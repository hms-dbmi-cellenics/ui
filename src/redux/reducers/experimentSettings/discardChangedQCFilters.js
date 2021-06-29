/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const discardChangedQCFilters = produce((draft) => {
  draft.processing.meta.changedQCFilters = new Set();
}, initialState);

export default discardChangedQCFilters;
