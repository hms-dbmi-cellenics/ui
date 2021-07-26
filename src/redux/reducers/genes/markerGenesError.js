/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const markerGenesError = produce((draft) => {
  draft.markers.loading = false;
  draft.markers.error = true;
}, initialState);

export default markerGenesError;
