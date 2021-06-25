/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from '../initialState';

const copyFilterSettingsToAllSamples = produce((draft, action) => {
  const { step, sampleId, allSampleIds } = action.payload;

  const settingsToCopy = original(draft.processing[step][sampleId]);

  allSampleIds.forEach((sampleIdToReplace) => {
    draft.processing[step][sampleIdToReplace] = settingsToCopy;
  });
}, initialState);

export default copyFilterSettingsToAllSamples;
