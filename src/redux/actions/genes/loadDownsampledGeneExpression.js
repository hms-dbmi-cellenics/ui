import { SparseMatrix } from 'mathjs';

import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const loadDownsampledGeneExpression = (
  experimentId,
  genes,
  componentUuid,
  downsampleSettings = null,
) => async (dispatch, getState) => {
  const { loading } = getState().genes.expression;

  // If other gene expression data is already being loaded, don't dispatch.
  if (loading.length > 0) {
    return null;
  }

  // Dispatch loading state.
  dispatch({
    type: GENES_EXPRESSION_LOADING,
    payload: {
      experimentId,
      componentUuid,
      genes,
    },
  });

  const body = {
    name: 'GeneExpression',
    genes,
    downsampled: true,
    downsampleSettings,
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

  try {
    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
      cellOrder,
    } = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
    const zScore = SparseMatrix.fromJSON(zScoreJson);

    dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
          truncatedExpression,
          zScore,
        },
        downsampledCellOrder: cellOrder,
      },
    });
  } catch (error) {
    dispatch({
      type: GENES_EXPRESSION_ERROR,
      payload: {
        experimentId,
        componentUuid,
        genes,
        error,
      },
    });
  }
};

export default loadDownsampledGeneExpression;
