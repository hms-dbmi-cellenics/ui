/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const samplesCreated = produce((draft, action) => {
  const { samples, experimentId } = action.payload;

  const { uuid: newSampleUuid } = sample;

  draft[experimentId].sampleIds.push(newSampleUuid);
}, initialState);

export default samplesCreated;
