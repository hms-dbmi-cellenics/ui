/* eslint-disable no-param-reassign */
import produce from 'immer';

import getInitialState from './getInitialState';

const markerGenesLoading = produce((draft) => {
  draft.markers.loading = true;
  draft.markers.error = false;
}, getInitialState());

export default markerGenesLoading;
