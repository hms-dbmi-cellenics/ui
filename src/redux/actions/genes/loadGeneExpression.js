import _ from 'lodash';
import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from '../../actionTypes/genes';
import pushNotificationMessage from '../pushNotificationMessage';
import { fetchCachedWork } from '../../../utils/cacheRequest';

const loadGeneExpression = (
  experimentId, genes, componentUuid, forceReloadAll = false,
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
      componentUuid,
      genes,
    },
  });

  // Check which of the genes we actually need to load. Only do this if
  // we are not forced to reload all of the data.
  let genesToFetch = [...genes];
  const genesAlreadyLoaded = new Set(Object.keys(geneData));

  if (!forceReloadAll) {
    genesToFetch = genesToFetch.filter((gene) => !genesAlreadyLoaded.has(gene));
  }

  if (genesToFetch.length === 0) {
    return dispatch({
      type: GENES_EXPRESSION_LOADED,
      payload: {
        experimentId,
        componentUuid,
        genes,
      },
    });
  }

  const body = {
    name: 'GeneExpression',
    genes: genesToFetch,
  };

  try {
    const data = await fetchCachedWork(experimentId, 30, body);
    if (Object.keys(data).length === 0) {
      throw Error('There is no information available for selected genes.');
    }
    if (data[genesToFetch[0]]?.error) {
      dispatch(pushNotificationMessage('error', data[genesToFetch[0]].message, 3));
      dispatch({
        type: GENES_EXPRESSION_LOADED,
        payload: {
          data: [],
          genes: genesAlreadyLoaded,
          loadingStatus: [],
        },
      });
    } else {
      let fetchedGenes = _.cloneDeep(genes);
      const index = genes.indexOf(genesToFetch[0]);
      // eslint-disable-next-line prefer-destructuring
      fetchedGenes[index] = Object.keys(data)[0];

      // making sure there are no repeating genes in the selectedGenes
      fetchedGenes = Array.from(new Set(fetchedGenes));

      dispatch({
        type: GENES_EXPRESSION_LOADED,
        payload: {
          experimentId,
          componentUuid,
          genes: fetchedGenes,
          data,
        },
      });
    }
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
