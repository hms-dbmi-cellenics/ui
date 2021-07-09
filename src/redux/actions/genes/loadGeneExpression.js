import _ from 'lodash';
import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from '../../actionTypes/genes';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
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

  const { backendStatus } = getState().experimentSettings;

  const upperCaseArray = (array) => (array.map((element) => element.toUpperCase()));

  const upperCaseGenes = new Set(upperCaseArray(genes));
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
  const genesAlreadyLoaded = Object.keys(geneData);

  if (!forceReloadAll) {
    genesToFetch = genesToFetch.filter(
      (gene) => !new Set(upperCaseArray(genesAlreadyLoaded)).has(gene.toUpperCase()),
    );
  }

  const displayedGenes = genesAlreadyLoaded.filter(
    (gene) => upperCaseGenes.has(gene.toUpperCase()),
  );

  if (genesToFetch.length === 0) {
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

  try {
    const data = await fetchCachedWork(
      experimentId, 30, body, backendStatus.status,
    );

    if (data[genesToFetch[0]]?.error) {
      pushNotificationMessage('error', data[genesToFetch[0]].message);
      dispatch({
        type: GENES_EXPRESSION_LOADED,
        payload: {
          data: [],
          genes: genesAlreadyLoaded,
          loadingStatus: [],
        },
      });
    } else {
      const fetchedGenes = _.concat(displayedGenes, Object.keys(data));

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
