/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from 'redux/reducers/genes/initialState';

const markerGenesLoaded = produce((draft, action) => {
  const {
    plotUuid,
    data: {
      order,
      rawExpression,
      truncatedExpression,
      stats,
    },
  } = action.payload;

  const expressionMatrix = original(draft).expression.matrix;

  expressionMatrix.pushGeneExpression(
    order,
    rawExpression,
    truncatedExpression,
    stats,
  );

  draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  draft.markers.loading = false;
  draft.markers.error = false;
}, initialState);

export default markerGenesLoaded;
