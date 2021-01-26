import {
  DIFF_EXPR_COMPARISON_GROUP_SET,
} from '../../actionTypes/differentialExpression';

const setComparisonGroup = (group) => async (dispatch) => {
  const {
    cellSet, compareWith, basis, type,
  } = group;

  dispatch({
    type: DIFF_EXPR_COMPARISON_GROUP_SET,
    payload: {
      type,
      cellSet,
      compareWith,
      basis,
    },
  });
};

export default setComparisonGroup;
