import {
  DIFF_EXPR_COMPARISON_GROUP_SET,
} from '../../actionTypes/differentialExpression';

const setComparisonGroup = (group) => async (dispatch) => {
  const { cellSet, compareWith, basis } = group;

  dispatch({
    action: DIFF_EXPR_COMPARISON_GROUP_SET,
    payload: {
      cellSet,
      compareWith,
      basis,
    },
  });
};

export default setComparisonGroup;
