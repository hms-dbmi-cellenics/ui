import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from '../../actionTypes/genes';

import { fetchCachedWork } from '../../../utils/cacheRequest';

const loadGeneExpression = (
  experimentId, genes, forceReloadAll = false,
) => async (dispatch, getState) => {
  const {
    loading, data: geneData,
  } = getState().genes.expression;

  // If other gene expression data is already being loaded, don't dispatch.
  if (loading.length > 0) {
    return null;
  }

  // Dispatch loading state.
  dispatch({
    type: GENES_EXPRESSION_LOADING,
    payload: {
      experimentId,
      genes,
    },
  });

  // Check which of the genes we actually need to load. Only do this if
  // we are not forced to reload all of the data.
  let genesToFetch = [...genes];

  if (!forceReloadAll) {
    const genesAlreadyLoaded = new Set(Object.keys(geneData));
    genesToFetch = genesToFetch.filter((gene) => !genesAlreadyLoaded.has(gene));
  }

  const body = {
    name: 'GeneExpression',
    genes: genesToFetch,
  };

  try {
    const res = await fetchCachedWork(experimentId, 30, body);
    const data = JSON.parse(res[0].body);

    dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        experimentId,
        data,
      },
    });
  } catch (e) {
    dispatch({
      type: GENES_EXPRESSION_ERROR,
      payload: {
        experimentId,
        genes,
        error: "Couldn't fetch expression data.",
      },
    });
  }
};

export default loadGeneExpression;
