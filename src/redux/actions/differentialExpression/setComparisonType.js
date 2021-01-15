import {
  DIFF_EXPR_COMPARISON_TYPE_SET,
} from '../../actionTypes/differentialExpression';

const setComparisonType = (type) => async (dispatch) => {
  dispatch({
    action: DIFF_EXPR_COMPARISON_TYPE_SET,
    payload: { type },
  });
};

export default setComparisonType;
