/* eslint-disable no-param-reassign */
import {
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
  UPDATE_CELL_INFO,
} from '../actionTypes';
import { fetchCachedWork } from '../../utils/cacheRequest';
import pushNotificationMessage from './notifications/pushNotificationMessage';

const DIFF_EXPR_TIMEOUT_SECONDS = 180;

const loadDiffExpr = (
  experimentId, comparisonType, selectedCellSets,
) => async (dispatch) => {
  dispatch({
    type: LOAD_DIFF_EXPR,
  });

  const ComparisonTypes = {
    One: 'Versus rest',
    Two: 'Across sets',
  };
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
    const res = await fetchCachedWork(experimentId, DIFF_EXPR_TIMEOUT_SECONDS, body);
    let data = {};
    try {
      data = JSON.parse(res[0].body);
    } catch (error) {
      console.error(error);
      data = { rows: [] };
    }
    const { rows } = data;
    const total = rows.length;
    rows.map((row) => {
      row.key = row.gene_names;
      return row;
    });
    return dispatch({
      type: UPDATE_DIFF_EXPR,
      data: {
        allData: rows,
        total,
      },
    });
  } catch (error) {
    dispatch(pushNotificationMessage('error', 'Failed to load Differential Expression data', 5));
  }
};

const updateCellInfo = (cellData) => (dispatch) => {
  dispatch({
    type: UPDATE_CELL_INFO,
    data: {
      ...cellData,
    },
  });
};

export {
  loadDiffExpr,
  updateCellInfo,
};
