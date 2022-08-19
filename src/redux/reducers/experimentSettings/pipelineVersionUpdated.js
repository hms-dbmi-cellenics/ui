/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const pipelineVersionUpdated = produce((draft, action) => {
  const {
    pipelineVersion,
  } = action.payload;

  draft.info.pipelineVersion = pipelineVersion;
}, initialState);

export default pipelineVersionUpdated;
