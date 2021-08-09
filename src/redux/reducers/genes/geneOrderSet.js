/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const markerGenesLoaded = produce((draft, action) => {
  const { order } = action.payload;
  draft.markers.order = order;
}, initialState);

export default markerGenesLoaded;
