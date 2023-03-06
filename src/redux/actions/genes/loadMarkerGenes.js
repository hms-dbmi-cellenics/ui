import { SparseMatrix } from 'mathjs';

import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { getCellSets } from 'redux/selectors';

const loadMarkerGenes = (
  experimentId, resolution, plotUuid, options = undefined,
) => async (dispatch, getState) => {
  const {
    numGenes = 5,
    groupedTracks = ['louvain'],
    selectedCellSet = 'louvain',
    selectedPoints = 'All',
  } = options;

  const cellSets = getCellSets()(getState());

  // Disabled linter because we are using == to check for both null and undefined values
  // eslint-disable-next-line eqeqeq
  if (experimentId == null || resolution == null) throw new Error('Null or undefined parameter/s for loadMarkerGenes');
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    cellSetKey: selectedCellSet,
    groupByClasses: groupedTracks,
    selectedPoints,
    hiddenCellSetKeys: Array.from(cellSets.hidden),
  };

  dispatch({
    type: MARKER_GENES_LOADING,
  });

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
      cellOrder,
    } = await fetchWork(experimentId, body, getState, dispatch, { timeout });

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
    const zScore = SparseMatrix.fromJSON(zScoreJson);

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        plotUuid,
        data: {
          orderedGeneNames,
          rawExpression,
          truncatedExpression,
          zScore,
          stats,
          cellOrder,
          downsampleSettings: {
            numGenes,
            groupedTracks,
            selectedCellSet,
            selectedPoints,
          },
        },
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCH_MARKER_GENES, undefined, false);
    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadMarkerGenes;
