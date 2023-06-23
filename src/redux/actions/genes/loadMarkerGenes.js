import { SparseMatrix } from 'mathjs';

import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const loadMarkerGenes = (
  experimentId, plotUuid, options = {},
) => async (dispatch, getState) => {
  const {
    numGenes = 5,
    groupedTracks = ['louvain'],
    selectedCellSet = 'louvain',
    selectedPoints = 'All',
    hiddenCellSets = [],
  } = options;

  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    downsampleSettings: {
      selectedCellSet,
      groupedTracks,
      selectedPoints,
      hiddenCellSets: Array.from(hiddenCellSets),
    },
  };

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    let requestETag;

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
      cellOrder,
    } = await fetchWork(
      experimentId,
      body,
      getState,
      dispatch,
      {
        timeout,
        onETagGenerated: (ETag) => {
          dispatch({ type: MARKER_GENES_LOADING, payload: { ETag } });
          requestETag = ETag;
        },
      },
    );

    // If the ETag is different, that means that a new request was sent in between
    // So we don't need to handle this outdated result
    if (getState().genes.expression.downsampledETag !== requestETag) {
      return;
    }

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
        },
      },
    });
  } catch (e) {
    if (e.message.includes('No cells found')) {
      dispatch({
        type: MARKER_GENES_LOADED,
        payload: {
          plotUuid,
          data: {
            orderedGeneNames: [],
            rawExpression: new SparseMatrix(),
            truncatedExpression: new SparseMatrix(),
            zScore: new SparseMatrix(),
            stats: {},
            cellOrder: [],
          },
        },
      });

      return;
    }

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
