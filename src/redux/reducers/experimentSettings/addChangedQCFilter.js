/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const addChangedQCFilter = produce((draft, action) => {
  const { stepKey } = action;

  draft.processing.meta.changedQCFilters.add(stepKey);
}, initialState);

export default addChangedQCFilter;
