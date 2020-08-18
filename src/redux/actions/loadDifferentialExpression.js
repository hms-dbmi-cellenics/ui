import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from '../actionTypes/differentialExpression';

import sendWork from '../../utils/sendWork';

const REQUEST_TIMEOUT = 60;

const loadDifferentialExpression = (
  experimentId, cellSets, tableState,
) => async (dispatch) => {
  dispatch({
    type: DIFF_EXPR_LOADING,
    payload: {
      experimentId,
    },
  });

  const currentPageSize = tableState.pagination.pageSize;

  const body = {
    name: 'DifferentialExpression',
    ...cellSets,
  };

  const pagination = {
    pagination: {
      orderBy: tableState.sorter.field,
      orderDirection: (tableState.sorter.order === 'ascend') ? 'ASC' : 'DESC',
      offset: ((tableState.pagination.current - 1) * currentPageSize),
      limit: currentPageSize,
      responseKey: 0,
    },
  };

  try {
    const response = await sendWork(experimentId, REQUEST_TIMEOUT, body, pagination);
    const data = JSON.parse(response.results[0].body);
    const { rows, total } = data;

    return dispatch({
      type: DIFF_EXPR_LOADED,
      payload: {
        experimentId,
        data: rows,
        cellSets,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    dispatch({
      type: DIFF_EXPR_ERROR,
      payload: {
        experimentId,
        error: "Couldn't fetch differential expression results data.",
      },
    });
  }
};

export default loadDifferentialExpression;
