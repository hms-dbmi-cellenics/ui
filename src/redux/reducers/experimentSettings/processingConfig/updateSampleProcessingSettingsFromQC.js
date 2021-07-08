/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const updateSampleProcessingSettingsFromQC = produce((draft, action) => {
  const {
    step, sampleId, newSettings,
  } = action.payload;

  draft.processing[step][sampleId] = newSettings;
  draft.originalProcessing[step][sampleId] = newSettings;
}, initialState);

export default updateSampleProcessingSettingsFromQC;
