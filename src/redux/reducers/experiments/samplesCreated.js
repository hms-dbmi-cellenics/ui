/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const samplesCreated = produce((draft, action) => {
  const { samples, experimentId } = action.payload;

  draft[experimentId].sampleIds.push(...samples.map(({ uuid }) => uuid));
}, initialState);

export default samplesCreated;
