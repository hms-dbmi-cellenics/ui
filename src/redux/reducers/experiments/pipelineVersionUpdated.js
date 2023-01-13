/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const pipelineVersionUpdated = produce((draft, action) => {
  const {
    experimentId,
    pipelineVersion,
  } = action.payload;

  if (draft[experimentId]) {
    draft[experimentId].pipelineVersion = pipelineVersion;
  }
}, initialState);

export default pipelineVersionUpdated;
