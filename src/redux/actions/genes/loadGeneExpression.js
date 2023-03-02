import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const loadGeneExpression = (
  experimentId, genes, componentUuid, checkDownsampledExpression = false,
) => async (dispatch, getState) => {
  const {
    loading, matrix, downsampledMatrix,
  } = getState().genes.expression;

  // If other gene expression data is already being loaded, don't dispatch.
  if (loading.length > 0) {
    return null;
  }

  const upperCaseArray = (array) => (array.map((element) => element.toUpperCase()));

  // Dispatch loading state.
  dispatch({
    type: GENES_EXPRESSION_LOADING,
    payload: {
      experimentId,
      componentUuid,
      genes,
    },
  });

  // Check which of the genes we actually need to load. Only do this if
  // we are not forced to reload all of the data.

  let genesToFetch = [...genes];
  let genesAlreadyLoaded = matrix.getStoredGenes();

  // If we can use the downsampled expressions,
  // then add them to decide which genes need to be loaded
  if (checkDownsampledExpression) {
    const downsampledGenesLoaded = downsampledMatrix.getStoredGenes();
    genesAlreadyLoaded = [...new Set(genesAlreadyLoaded.concat(downsampledGenesLoaded))];
  }

  genesToFetch = genesToFetch.filter(
    (gene) => !new Set(upperCaseArray(genesAlreadyLoaded)).has(gene.toUpperCase()),
  );

  const displayedGenes = genesAlreadyLoaded.filter(
    (gene) => upperCaseArray(genes).includes(gene.toUpperCase()),
  );

  if (genesToFetch.length === 0) {
    // All genes are already loaded.
    return dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        experimentId,
        componentUuid,
        genes: displayedGenes,
      },
    });
  }

  const body = {
    name: 'GeneExpression',
    genes: genesToFetch,
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

    const fetchedGenes = _.concat(displayedGenes, orderedGeneNames);

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
