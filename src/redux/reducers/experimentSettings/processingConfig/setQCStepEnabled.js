/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const setQCStepEnabled = produce((draft, action) => {
  const { step, enabled } = action.payload;

  const {
    enabled: oldEnable, auto, filterSettings, ...sampleIds
  } = draft.processing[step];

  draft.processing[step].enabled = enabled;

  // Filter is applied per samples in the pipeline
  Object.keys(sampleIds).forEach((sampleId) => {
    draft.processing[step][sampleId].enabled = enabled;
  });

  draft.processing.meta.changedQCFilters.add(step);
}, initialState);

export default setQCStepEnabled;
