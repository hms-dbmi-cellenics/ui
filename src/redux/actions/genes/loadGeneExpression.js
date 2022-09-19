import _ from 'lodash';

import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_ERROR, GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const loadGeneExpression = (
  experimentId, genes, componentUuid, forceReloadAll = false,
) => async (dispatch, getState) => {
  const {
    loading, matrix,
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
  const genesAlreadyLoaded = matrix.getStoredGenes();

  if (!forceReloadAll) {
    genesToFetch = genesToFetch.filter(
      (gene) => !new Set(upperCaseArray(genesAlreadyLoaded)).has(gene.toUpperCase()),
    );
  }

  const displayedGenes = genesAlreadyLoaded.filter(
    (gene) => upperCaseArray(genes).includes(gene.toUpperCase()),
  );

  if (genesToFetch.length === 0) {
    console.log('All genes are already loaded.');
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
    const data = await fetchWork(
      experimentId, body, getState, { timeout },
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
