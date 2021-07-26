/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const backendStatusLoading = produce((draft) => {
  draft.backendStatus.loading = true;
  draft.backendStatus.error = false;
}, initialState);

export default backendStatusLoading;
