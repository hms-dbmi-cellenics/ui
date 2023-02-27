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
      heatmapSettings,
    },
  } = action.payload;

  const downsampledExpressionMatrix = original(draft).expression.downsampledMatrix;

  downsampledExpressionMatrix.pushGeneExpression(
    orderedGeneNames,
    rawExpression,
    truncatedExpression,
    zScore,
    stats,
  );

  draft.expression.downsampledCellIndexes = cellOrder;
  draft.expression.downsampledHeatmapSettings = heatmapSettings;

  draft.expression.views[plotUuid] = { fetching: false, error: false, data: orderedGeneNames };

  draft.markers.loading = false;
  draft.markers.error = false;
}, getInitialState());

export default markerGenesLoaded;
