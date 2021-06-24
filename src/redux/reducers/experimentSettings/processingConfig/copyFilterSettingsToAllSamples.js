/* eslint-disable no-param-reassign */
import produce from 'immer';

const copyFilterSettingsToAllSamples = produce((draft, action) => {
  const { step, sampleId, allSampleIds } = action.payload;

  const settingsToCopy = draft.processing[step][sampleId];

  allSampleIds.forEach((sampleIdToReplace) => {
    draft.processing[step][sampleIdToReplace] = settingsToCopy;
  });
});

export default copyFilterSettingsToAllSamples;
