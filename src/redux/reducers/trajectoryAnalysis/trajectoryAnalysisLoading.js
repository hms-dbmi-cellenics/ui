/* eslint-disable no-param-reassign */
import { produce } from 'immer';

import initialState from './initialState';

const trajectoryAnalysisLoading = produce((draft) => {
  draft.loading = true;
  draft.error = false;

  // Reset pseudotime?
  draft.pseudotime = [];
}, initialState);

export default trajectoryAnalysisLoading;
