import initialState from './initialState';
import {
  DIFF_EXPR_LOADING,
  DIFF_EXPR_LOADED,
  DIFF_EXPR_ERROR,
  DIFF_EXPR_COMPARISON_TYPE_SET,
  DIFF_EXPR_COMPARISON_GROUP_SET,
  DIFF_EXPR_ADV_FILTERS_SET,
} from '../../actionTypes/differentialExpression';
import { EXPERIMENT_SETTINGS_PIPELINE_START } from '../../actionTypes/experimentSettings';

import differentialExpressionLoading from './differentialExpressionLoading';
import differentialExpressionLoaded from './differentialExpressionLoaded';
import differentialExpressionError from './differentialExpressionError';
import differentialExpressionSetType from './differentialExpressionSetType';
import differentialExpressionSetGroup from './differentialExpressionSetGroup';
import differentialExpressionSetAdvFilters from './differentialExpressionSetAdvFilters';

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
    case DIFF_EXPR_COMPARISON_TYPE_SET: {
      return differentialExpressionSetType(state, action);
    }
    case DIFF_EXPR_COMPARISON_GROUP_SET: {
      return differentialExpressionSetGroup(state, action);
    }
    case DIFF_EXPR_ADV_FILTERS_SET: {
      return differentialExpressionSetAdvFilters(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_START: {
      return initialState;
    }
    default: {
      return state;
    }
  }
};

export default differentialExpressionReducer;
