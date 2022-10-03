/* eslint-disable no-param-reassign */
import produce from 'immer';

import constructInitialState from './constructInitialState';

const markerGenesLoading = produce((draft) => {
  draft.markers.loading = true;
  draft.markers.error = false;
}, constructInitialState());

export default markerGenesLoading;
