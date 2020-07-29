import initialState from './initialState';
import {
  DIFF_EXPR_LOADING,
  DIFF_EXPR_LOADED,
  DIFF_EXPR_ERROR,
} from '../../actionTypes/differentialExpression';

import differentialExpressionLoading from './differentialExpressionLoading';
import differentialExpressionLoaded from './differentialExpressionLoaded';
import differentialExpressionError from './differentialExpressionError';


const differentialExpressionReducer = (state = initialState, action) => {
  switch (action.type) {
    case DIFF_EXPR_LOADING: {
      return differentialExpressionLoading(state, action);
    }
    case DIFF_EXPR_LOADED: {
      return differentialExpressionLoaded(state, action);
    }
    case DIFF_EXPR_ERROR: {
      return differentialExpressionError(state, action);
    }
    default: {
      return state;
    }
  }
};

export default differentialExpressionReducer;
