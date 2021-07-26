/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const setSampleFilterSettingsAuto = produce((draft, action) => {
  const { step, sampleId, isAuto } = action.payload;

  draft.processing[step][sampleId].auto = isAuto;

  if (isAuto) {
    draft.processing[step][sampleId]
      .filterSettings = current(draft.processing[step][sampleId]).defaultFilterSettings;
  }
}, initialState);

export default setSampleFilterSettingsAuto;
