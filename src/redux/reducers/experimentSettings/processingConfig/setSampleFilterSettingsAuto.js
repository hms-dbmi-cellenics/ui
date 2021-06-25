/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, enabled } = action.payload;

  draft.processing[step][sampleId].auto = enabled;
}, initialState);

export default setSampleFilterSettingsAuto;
