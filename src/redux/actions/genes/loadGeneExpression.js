import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import upperCaseArray from 'utils/upperCaseArray';

const findLoadedGenes = (matrix, selectedGenes) => {
  // Check which of the genes we actually need to load. Only do this if
  // we are not forced to reload all of the data.
  const storedGenes = matrix.getStoredGenes();
  const genesToLoad = [...selectedGenes].filter(
    (gene) => !new Set(upperCaseArray(storedGenes)).has(gene.toUpperCase()),
  );

  const genesAlreadyLoaded = storedGenes.filter(
    (gene) => upperCaseArray(selectedGenes).includes(gene.toUpperCase()),
  );

  return { genesToLoad, genesAlreadyLoaded };
};

const loadGeneExpression = (
  experimentId,
  genes,
  componentUuid,
) => async (dispatch, getState) => {
  const { loading, matrix } = getState().genes.expression.full;

  // If other gene expression data is already being loaded, don't dispatch.
  if (loading.length > 0) {
    return null;
  }
  const { genesToLoad, genesAlreadyLoaded } = findLoadedGenes(matrix, genes);

  if (genesToLoad.length === 0) {
    // All genes are already loaded.
    return dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        experimentId,
        componentUuid,
        genes: genesAlreadyLoaded,
      },
    });
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
    genes: genesToLoad,
    downsampled: false,
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

  try {
    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      truncatedExpression: truncatedExpressionJson,
      zScore: zScoreJson,
      stats,
    } = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);
    const truncatedExpression = SparseMatrix.fromJSON(truncatedExpressionJson);
    const zScore = SparseMatrix.fromJSON(zScoreJson);

    const fetchedGenes = _.concat(genesAlreadyLoaded, orderedGeneNames);

    dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes: fetchedGenes,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
          truncatedExpression,
          zScore,
        },
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

export default loadGeneExpression;
