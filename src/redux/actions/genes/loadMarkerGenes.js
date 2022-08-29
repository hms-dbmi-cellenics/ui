import { SparseMatrix } from 'mathjs';

import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const loadMarkerGenes = (
  experimentId, resolution, plotUuid, numGenes = 5, selectedCellSet = 'louvain',
) => async (dispatch, getState) => {
  // Disabled linter because we are using == to check for both null and undefined values
  // eslint-disable-next-line eqeqeq
  if (experimentId == null || resolution == null) throw new Error('Null or undefined parameter/s for loadMarkerGenes');
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    cellSetKey: selectedCellSet,
  };

  dispatch({
    type: MARKER_GENES_LOADING,
  });

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    console.log('[DEBUG] - BEGUN fetchWork');

    const {
      order,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      stats,
    } = await fetchWork(experimentId, body, getState, { timeout });
    console.log('[DEBUG] - FINISHED fetchWork');

    console.log('[DEBUG] - BEGUN const rawExpression = SparseMatrix.fromJSON');
    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    console.log('rawExpressionJsonDebug');
    console.log(rawExpressionJson);
    console.log('[DEBUG] - FINISHED const rawExpression = SparseMatrix.fromJSON');
    console.log('[DEBUG] - BEGUN const truncatedExpression = SparseMatrix.fromJSON');
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
    console.log('[DEBUG] - FINISHED const truncatedExpression = SparseMatrix.fromJSON');

    console.log('rawExpressionDebug');
    console.log(rawExpression);

    console.log('truncatedExpressionDebug');
    console.log(truncatedExpression);

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        plotUuid,
        data: {
          order,
          rawExpression,
          truncatedExpression,
          stats,
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
