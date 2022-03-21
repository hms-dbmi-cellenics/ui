import { CELL_SETS_DELETE } from 'redux/actionTypes/cellSets';
import {
  DIFF_EXPR_LOADING,
  DIFF_EXPR_LOADED,
  DIFF_EXPR_ERROR,
  DIFF_EXPR_COMPARISON_TYPE_SET,
  DIFF_EXPR_COMPARISON_GROUP_SET,
  DIFF_EXPR_ORDERING_SET,
} from 'redux/actionTypes/differentialExpression';
import { EXPERIMENT_SETTINGS_PIPELINE_START } from 'redux/actionTypes/experimentSettings';

import differentialExpressionLoading from 'redux/reducers/differentialExpression/differentialExpressionLoading';
import differentialExpressionLoaded from 'redux/reducers/differentialExpression/differentialExpressionLoaded';
import differentialExpressionError from 'redux/reducers/differentialExpression/differentialExpressionError';
import differentialExpressionSetType from 'redux/reducers/differentialExpression/differentialExpressionSetType';
import differentialExpressionSetGroup from 'redux/reducers/differentialExpression/differentialExpressionSetGroup';
import differentialExpressionSetGeneOrdering from 'redux/reducers/differentialExpression/differentialExpressionSetOrdering';
import cellSetsDelete from 'redux/reducers/differentialExpression/cellSetsDelete';
import initialState from 'redux/reducers/differentialExpression/initialState';

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
    case DIFF_EXPR_ORDERING_SET: {
      return differentialExpressionSetGeneOrdering(state, action);
    }
    case EXPERIMENT_SETTINGS_PIPELINE_START: {
      return initialState;
    }
    case CELL_SETS_DELETE: {
      return cellSetsDelete(state, action);
    }
    default: {
      return state;
    }
  }
};

export default differentialExpressionReducer;
