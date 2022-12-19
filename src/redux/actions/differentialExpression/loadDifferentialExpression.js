import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

import { getCellSetKey } from 'utils/cellSets';

function getArray(object) {
  return Object.keys(object).reduce((r, k) => {
    object[k].forEach((a, i) => {
      // eslint-disable-next-line no-param-reassign
      r[i] = r[i] || {};
      // eslint-disable-next-line no-param-reassign
      r[i][k] = a;
    });
    return r;
  }, []);
}

const generateDiffExprBody = (experimentId, comparisonGroup, comparisonType, extras) => ({
  name: 'DifferentialExpression',
  experimentId,
  cellSet: getCellSetKey(comparisonGroup.cellSet),
  compareWith: getCellSetKey(comparisonGroup.compareWith),
  basis: getCellSetKey(comparisonGroup.basis),
  comparisonType,
  ...extras,
});

const loadDifferentialExpression = (
  experimentId, comparisonGroup, comparisonType, tableState, newAdvancedFilters = null,
) => async (dispatch, getState) => {
  const advancedFilters = newAdvancedFilters
    ?? getState().differentialExpression.comparison.advancedFilters;

  dispatch({
    type: DIFF_EXPR_LOADING,
    payload: {
      experimentId,
      advancedFilters,
    },
  });

  const body = generateDiffExprBody(experimentId, comparisonGroup, comparisonType);
  let extras = {};
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
    if (advancedFilters.length > 0) {
      pagination.filters = advancedFilters;
    }
    if (tableState.geneNamesFilter) {
      pagination.filters = [{
        columnName: 'gene_names',
        type: 'text',
        expression: tableState.geneNamesFilter,
      }];
    }
    extras = { pagination };
  }

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout, extras },
    );

    // eslint-disable-next-line prefer-const
    let { total, data: diffExprData } = data;

    const rows = getArray(diffExprData);

    if (!total && !Object.keys(pagination).length) {
      total = rows.length;
    }

    dispatch({
      type: DIFF_EXPR_LOADED,
      payload: {
        experimentId,
        data: rows,
        comparisonGroup,
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
export {
  generateDiffExprBody,
};
