import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getCellSetName = (name) => (name?.split('/')[1] || name);

const loadDifferentialExpression = (
  experimentId, cellSets, comparisonType, tableState, applyAdvancedFilters = false,
) => async (dispatch, getState) => {
  dispatch({
    type: DIFF_EXPR_LOADING,
    payload: {
      experimentId,
    },
  });
  console.log('STATE LOL', getState());
  const advancedFilters = applyAdvancedFilters
    ? getState().differentialExpression.comparison.advancedFilters : [];
  console.log('SENDING ADVANCED FILTERS', advancedFilters);
  const body = {
    name: 'DifferentialExpression',
    experimentId,
    cellSet: getCellSetName(cellSets.cellSet),
    compareWith: getCellSetName(cellSets.compareWith),
    basis: getCellSetName(cellSets.basis),
    filters: advancedFilters,
  };

  let pagination = {};

  if (tableState) {
    const currentPageSize = tableState.pagination.pageSize;

    pagination = {
      orderBy: tableState.sorter.field,
      orderDirection: (tableState.sorter.order === 'ascend') ? 'ASC' : 'DESC',
      offset: ((tableState.pagination.current - 1) * currentPageSize),
      limit: currentPageSize,
      responseKey: 0,
    };

    if (tableState.geneNamesFilter) {
      pagination.filters = [{
        columnName: 'gene_names',
        type: 'text',
        expression: tableState.geneNamesFilter,
      }];
    }

    pagination = { pagination };
  }

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const data = await fetchWork(
      experimentId, body, getState, { timeout, extras: pagination },
    );

    let { total } = data;
    const { rows } = data;

    if (!total && !Object.keys(pagination).length) {
      total = rows.length;
    }

    dispatch({
      type: DIFF_EXPR_LOADED,
      payload: {
        experimentId,
        data: rows,
        cellSets,
        total,
        comparisonType,
      },
    });
  } catch (error) {
    dispatch({
      type: DIFF_EXPR_ERROR,
      payload: {
        experimentId,
        error,
      },
    });
  }
};

export default loadDifferentialExpression;
