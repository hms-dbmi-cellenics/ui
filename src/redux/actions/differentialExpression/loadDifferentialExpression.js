import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from 'redux/actionTypes/differentialExpression';

import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getCellSetName = (name) => (name?.split('/')[1] || name);

const generateDiffExprBody = (experimentId, comparisonGroup, extras) => ({
  name: 'DifferentialExpression',
  experimentId,
  cellSet: getCellSetName(comparisonGroup.cellSet),
  compareWith: getCellSetName(comparisonGroup.compareWith),
  basis: getCellSetName(comparisonGroup.basis),
  ...extras,
});

const loadDifferentialExpression = (
  experimentId, comparisonGroup, comparisonType, tableState,
) => async (dispatch, getState) => {
  dispatch({
    type: DIFF_EXPR_LOADING,
    payload: {
      experimentId,
    },
  });

  const body = generateDiffExprBody(experimentId, comparisonGroup);

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
  }

  const timeout = getTimeoutForWorkerTask(getState(), 'DifferentialExpression');

  try {
    const data = await fetchWork(
      experimentId, body, getState, { timeout, extras: { pagination } },
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
        cellSets: comparisonGroup,
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
