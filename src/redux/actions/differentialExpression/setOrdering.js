import {
  DIFF_EXPR_ORDERING_SET,
} from '../../actionTypes/differentialExpression';

const setOrdering = (orderBy, orderDirection) => async (dispatch) => {
  dispatch({
    type: DIFF_EXPR_ORDERING_SET,
    payload: {
      orderBy,
      orderDirection,
    },
  });
};

export default setOrdering;
