/* eslint-disable no-param-reassign */
import produce, { current } from 'immer';
import _ from 'lodash';

import initialState from '../initialState';

const updateSampleFilterSettings = produce((draft, action) => {
  const {
    step, sampleId, diff,
  } = action.payload;

  const previousSettings = current(draft.processing[step][sampleId].filterSettings);

  const updatedSettings = _.cloneDeep(previousSettings);
  _.merge(updatedSettings, diff);

  draft.processing[step][sampleId].filterSettings = updatedSettings;
}, initialState);

export default updateSampleFilterSettings;
