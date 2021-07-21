/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const markerGenesLoading = produce((draft) => {
  draft.markers.loading = true;
  draft.markers.error = false;
}, initialState);

export default markerGenesLoading;
