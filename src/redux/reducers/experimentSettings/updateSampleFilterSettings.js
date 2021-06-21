/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import initialState from './initialState';

// Perform object destructuring to avoid picking extra properties if choosing the default values
const getPreviousSettings = (draft, step, sampleId) => {
  const defaultFilterSettings = original(draft.processing[step].filterSettings);
  const previousSettings = original(draft.processing[step][sampleId]?.filterSettings);

  return previousSettings ?? defaultFilterSettings;
};

const updateSampleFilterSettings = produce((draft, action) => {
  const { step, sampleId, diff } = action.payload;

  const previousSettings = getPreviousSettings(draft, step, sampleId);

  const updatedSettings = _.cloneDeep(previousSettings);
  _.merge(updatedSettings, diff);

  draft.processing[step][sampleId].filterSettings = updatedSettings;
}, initialState);

export default updateSampleFilterSettings;
