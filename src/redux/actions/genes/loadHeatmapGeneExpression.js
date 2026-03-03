import { SparseMatrix } from 'mathjs';

import {
  HEATMAP_GENES_EXPRESSION_LOADING,
  HEATMAP_GENES_EXPRESSION_ERROR,
  HEATMAP_GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import upperCaseArray from 'utils/upperCaseArray';

const findLoadedGenes = (matrix, selectedGenes) => {
  // Check which of the genes we actually need to load.
  const storedGenes = matrix.getStoredGenes();
  const genesToLoad = [...selectedGenes].filter(
    (gene) => !new Set(upperCaseArray(storedGenes)).has(gene.toUpperCase()),
  );

  const genesAlreadyLoaded = storedGenes.filter(
    (gene) => upperCaseArray(selectedGenes).includes(gene.toUpperCase()),
  );

  return { genesToLoad, genesAlreadyLoaded };
};

const loadHeatmapGeneExpression = (
  experimentId,
  genes,
  componentUuid,
) => async (dispatch, getState) => {
  const state = getState();
  const { matrix } = state.genes.expression.full;
  const { genesToLoad } = findLoadedGenes(matrix, genes);

  let newGenes = null;

  // Only dispatch LOADING if we actually have genes to fetch
  if (genesToLoad.length > 0) {
    dispatch({
      type: HEATMAP_GENES_EXPRESSION_LOADING,
      payload: {
        experimentId, componentUuid, genes: genesToLoad, ETag: null,
      },
    });

    try {
      const body = { name: 'GeneExpression', genes: genesToLoad };
      const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');
      const { orderedGeneNames, rawExpression: rawExpressionJson, stats } = await fetchWork(
        experimentId,
        body,
        getState,
        dispatch,
        { timeout },
      );

      newGenes = {
        orderedGeneNames,
        stats,
        rawExpression: SparseMatrix.fromJSON(rawExpressionJson),
      };
    } catch (error) {
      dispatch({
        type: HEATMAP_GENES_EXPRESSION_ERROR,
        payload: {
          experimentId, componentUuid, genes, error,
        },
      });
      return;
    }
  }

  // Always dispatch LOADED, with newGenes only if we have data
  dispatch({
    type: HEATMAP_GENES_EXPRESSION_LOADED,
    payload: {
      componentUuid, genes, ETag: null, ...(newGenes && { newGenes }),
    },
  });
};

export default loadHeatmapGeneExpression;
