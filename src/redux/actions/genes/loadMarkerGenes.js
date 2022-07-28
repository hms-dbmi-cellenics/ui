import { SparseMatrix } from 'mathjs';

import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

// const calculateZScoreWithSparseMatrix = (responseData) => {
//   const dataWithZScore = Object.entries(responseData).reduce((acc, [gene, value]) => {
//     const { mean, stdev, expression } = value.rawExpression;
//     const zScore = expression.map((x) => (x !== null ? ((x - mean) / stdev) : null));

//     acc[gene] = {
//       ...value,
//       zScore,
//     };

//     return acc;
//   }, {});

//   return dataWithZScore;
// };

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

    const {
      order,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      stats,
    } = await fetchWork(experimentId, body, getState, { timeout });

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);

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
