/* eslint-disable no-param-reassign */
import produce from 'immer';

import getInitialState from './getInitialState';

const markerGenesLoading = produce((draft, action) => {
  const { ETag } = action.payload;

  draft.markers.loading = true;
  draft.markers.error = false;
  draft.expression.downsampled.ETag = ETag;
}, getInitialState());

export default markerGenesLoading;
