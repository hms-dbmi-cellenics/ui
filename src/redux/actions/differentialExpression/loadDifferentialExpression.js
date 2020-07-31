import {
  DIFF_EXPR_LOADING, DIFF_EXPR_LOADED, DIFF_EXPR_ERROR,
} from '../../actionTypes/differentialExpression';

import { fetchCachedWork } from '../../../utils/cacheRequest';

const ComparisonTypes = {
  One: 'Versus rest',
  Two: 'Across sets',
};

const REQUEST_TIMEOUT = 60;

const loadDifferentialExpression = (
  experimentId, comparisonType, selectedCellSets,
) => async (dispatch) => {
  dispatch({
    type: DIFF_EXPR_LOADING,
    payload: {
      experimentId,
    },
  });

  const body = {
    name: 'DifferentialExpression',
    maxNum: 100,
    cellSet: selectedCellSets.first,
  };

  if (comparisonType === ComparisonTypes.One) {
    body.compareWith = 'rest';
  } else {
    body.compareWith = selectedCellSets.second;
  }

  try {
    const res = await fetchCachedWork(experimentId, REQUEST_TIMEOUT, body);
    const data = JSON.parse(res[0].body);
    const { rows } = data;

    return dispatch({
      type: DIFF_EXPR_LOADED,
      payload: {
        experimentId,
        data: rows,
        cellSets: selectedCellSets,
        total: rows.length,
      },
    });
  } catch (error) {
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
