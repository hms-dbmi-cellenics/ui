/* eslint-disable no-param-reassign */
import produce from 'immer';

import constructInitialState from './constructInitialState';

const markerGenesError = produce((draft) => {
  draft.markers.loading = false;
  draft.markers.error = true;
}, constructInitialState());

export default markerGenesError;
