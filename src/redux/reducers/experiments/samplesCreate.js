/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const samplesCreate = produce((draft, action) => {
  const { sample, experimentId } = action.payload;

  const { uuid: newSampleUuid } = sample;

  draft[experimentId].sampleIds.push(newSampleUuid);
}, initialState);

export default samplesCreate;
