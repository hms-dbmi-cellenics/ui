/* eslint-disable no-param-reassign */
import { produce } from 'immer';

import initialState from './initialState';

const trajectoryAnalysisLoaded = produce((draft, action) => {
  const { data } = action.payload;

  draft.loading = false;
  draft.error = false;
  draft.plotData = data;
}, initialState);

export default trajectoryAnalysisLoaded;
