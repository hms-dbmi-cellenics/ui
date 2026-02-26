/* eslint-disable no-param-reassign */
import produce from 'immer';

import getInitialState from 'redux/reducers/genes/getInitialState';

const markerGenesLoaded = produce((draft, action) => {
  const {
    plotUuid,
    ETag,
    data: {
      orderedGeneNames,
      cellOrder,
    },
  } = action.payload;

  draft.expression.downsampled.cellOrder = cellOrder;
  draft.expression.downsampled.ETag = ETag;

  draft.expression.views[plotUuid] = {
    fetching: false, error: false, data: orderedGeneNames, markers: true,
  };

  draft.markers.loading = false;
  draft.markers.error = false;
}, getInitialState());

export default markerGenesLoaded;
