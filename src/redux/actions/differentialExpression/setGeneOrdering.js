import {
  DIFF_EXPR_ORDERING_SET,
} from 'redux/actionTypes/differentialExpression';

const setGeneOrdering = (orderBy, orderDirection) => async (dispatch) => {
  dispatch({
    type: DIFF_EXPR_ORDERING_SET,
    payload: {
      orderBy,
      orderDirection,
    },
  });
};

export default setGeneOrdering;
