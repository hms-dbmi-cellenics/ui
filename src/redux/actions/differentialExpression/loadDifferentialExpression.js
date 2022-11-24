import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

import { getCellSetKey } from 'utils/cellSets';

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

    let { total } = data;
    const rows = data.Gene.map((gene, indx) => ({
      p_val: data.p_val[indx],
      logFC: data.logFC[indx],
      pct_1: data.pct_1[indx],
      pct_2: data.pct_2[indx],
      p_val_adj: data.p_val_adj[indx],
      auc: data.auc[indx],
      gene_names: data.gene_names[indx],
      Gene: gene,
    }));

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
