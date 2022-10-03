/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import getInitialState from 'redux/reducers/genes/getInitialState';

const markerGenesLoaded = produce((draft, action) => {
  const {
    plotUuid,
    data: {
      order,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    },
  } = action.payload;

  const expressionMatrix = original(draft).expression.matrix;

  expressionMatrix.pushGeneExpression(
    order,
    rawExpression,
    truncatedExpression,
    zScore,
    stats,
  );

  draft.expression.views[plotUuid] = { fetching: false, error: false, data: order };

  draft.markers.loading = false;
  draft.markers.error = false;
}, getInitialState());

export default markerGenesLoaded;
