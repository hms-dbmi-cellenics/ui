/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsLoading = produce((draft) => {
  draft.initialLoadPending = false;
  draft.loading = true;
  draft.error = false;
  draft.selected = {};
}, initialState);

export default cellSetsLoading;
