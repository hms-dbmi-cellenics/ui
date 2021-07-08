import _ from 'lodash';
/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const copyFilterSettingsToAllSamples = produce((draft, action) => {
  const { step, newSettings, sampleIds } = action.payload;

  sampleIds.forEach((sampleIdToReplace) => {
    draft
      .processing[step][sampleIdToReplace].filterSettings = _.cloneDeep(newSettings.filterSettings);
  });
}, initialState);

export default copyFilterSettingsToAllSamples;
