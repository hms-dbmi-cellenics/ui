/* eslint-disable no-param-reassign */
import produce from 'immer';

import getInitialState from './getInitialState';

const markerGenesError = produce((draft) => {
  draft.markers.loading = false;
  draft.markers.error = true;
}, getInitialState());

export default markerGenesError;
