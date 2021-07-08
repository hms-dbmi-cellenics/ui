/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const setQCStepEnabled = produce((draft, action) => {
  const { step, enabled } = action.payload;

  draft.processing[step].enabled = enabled;

  draft.processing.meta.changedQCFilters.add(step);
}, initialState);

export default setQCStepEnabled;
