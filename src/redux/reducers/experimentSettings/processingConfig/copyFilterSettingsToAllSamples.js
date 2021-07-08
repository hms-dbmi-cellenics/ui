import _ from 'lodash';
/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const copyFilterSettingsToAllSamples = produce((draft, action) => {
  const { step, sourceSampleId, sampleIds } = action.payload;

  const sourceSettings = current(draft.processing[step][sourceSampleId]);

  // Remove sourceSampleId because we don't want to set auto = false on it
  const index = sampleIds.indexOf(sourceSampleId);
  if (index > -1) {
    sampleIds.splice(index, 1);
  }

  sampleIds.forEach((sampleIdToReplace) => {
    draft.processing[step][sampleIdToReplace].auto = false;
    draft.processing[step][sampleIdToReplace]
      .filterSettings = _.cloneDeep(sourceSettings.filterSettings);
  });
}, initialState);

export default copyFilterSettingsToAllSamples;
