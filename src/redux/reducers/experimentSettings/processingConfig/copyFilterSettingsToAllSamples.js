import _ from 'lodash';
/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';

import initialState from '../initialState';

const copyFilterSettingsToAllSamples = produce((draft, action) => {
  const { step, sourceSampleId, sampleIds } = action.payload;

  const sourceSettings = current(draft.processing[step][sourceSampleId]);
  const samplesToReplace = [...sampleIds].filter((sampleId) => sampleId !== sourceSampleId);

  samplesToReplace.forEach((sampleIdToReplace) => {
    draft.processing[step][sampleIdToReplace].auto = sourceSettings.auto;
    if (!sourceSettings.auto) {
      draft.processing[step][sampleIdToReplace]
        .filterSettings = _.cloneDeep(sourceSettings.filterSettings);
    }
  });
}, initialState);

export default copyFilterSettingsToAllSamples;
