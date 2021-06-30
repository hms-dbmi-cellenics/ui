/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, isAuto } = action.payload;

  draft.processing[step][sampleId].auto = isAuto;
}, initialState);

export default setSampleFilterSettingsAuto;
