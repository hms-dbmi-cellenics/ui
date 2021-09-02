/* eslint-disable no-param-reassign */
import { produce } from 'immer';

import initialState from './initialState';

const trajectoryAnalysisError = produce((draft, action) => {
  const { error } = action.payload;

  draft.loading = false;
  draft.error = error;
}, initialState);

export default trajectoryAnalysisError;
