/* eslint-disable no-param-reassign */
import _ from 'lodash';

import {
  GENES_PROPERTIES_LOADING,
  GENES_PROPERTIES_LOADED_PAGINATED, GENES_PROPERTIES_ERROR,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const loadPaginatedGeneProperties = (
  experimentId, properties, componentUuid, tableState,
) => async (dispatch, getState) => {
  const { loading } = getState().genes.properties;

  if (_.intersection(loading, properties).length > 0) {
    return null;
  }

  dispatch({
    type: GENES_PROPERTIES_LOADING,
    payload: { properties, componentUuid },
  });

  const orderBy = tableState.sorter.field;
  const orderDirection = tableState.sorter.order;
  const currentPage = tableState.pagination.current;
  const currentPageSize = tableState.pagination.pageSize;
  const geneNameFilter = tableState.geneNamesFilter;

  const body = {
    name: 'ListGenes',
    selectFields: ['gene_names', ...properties],
    orderBy,
    orderDirection: (orderDirection === 'ascend') ? 'ASC' : 'DESC',
    offset: ((currentPage - 1) * currentPageSize),
    limit: currentPageSize,
  };

  if (geneNameFilter) {
    body.geneNamesFilter = tableState.geneNamesFilter;
  }

  const timeout = getTimeoutForWorkerTask(getState(), 'ListGenes');

  try {
    const { gene_names: geneNames, dispersions, total } = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    const loadedProperties = {};

    geneNames.forEach((gene, indx) => {
      loadedProperties[gene] = { dispersions: dispersions[indx] };
    });

    return dispatch({
      type: GENES_PROPERTIES_LOADED_PAGINATED,
      payload: {
        experimentId,
        properties,
        data: loadedProperties,
        total,
        componentUuid,
      },
    });
  } catch (error) {
    return dispatch({
      type: GENES_PROPERTIES_ERROR,
      payload: {
        experimentId,
        componentUuid,
        properties,
        error,
      },
    });
  }
};

export default loadPaginatedGeneProperties;
