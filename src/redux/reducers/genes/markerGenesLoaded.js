/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import getInitialState from 'redux/reducers/genes/getInitialState';

const markerGenesLoaded = produce((draft, action) => {
  const {
    plotUuid,
    data: {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
      cellOrder,
    },
  } = action.payload;

  const downsampledExpressionMatrix = original(draft).expression.downsampled.matrix;

  downsampledExpressionMatrix.setGeneExpression(
    orderedGeneNames,
    rawExpression,
    truncatedExpression,
    zScore,
    stats,
  );

  draft.expression.downsampled.cellOrder = cellOrder;

  draft.expression.views[plotUuid] = {
    fetching: false, error: false, data: orderedGeneNames, markers: true,
  };

  draft.markers.loading = false;
  draft.markers.error = false;
}, getInitialState());

export default markerGenesLoaded;
