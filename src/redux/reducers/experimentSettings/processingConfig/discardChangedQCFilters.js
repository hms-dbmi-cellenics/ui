/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const discardChangedQCFilters = produce((draft) => {
  const originalProcessing = current(draft.originalProcessing);

  Object.entries(originalProcessing).forEach(([key, value]) => {
    draft.processing[key] = value;
  });

  draft.processing.meta.changedQCFilters = new Set();
}, initialState);

export default discardChangedQCFilters;
