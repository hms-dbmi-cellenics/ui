/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellSetsReducer from './cellSetsReducer';
import notificationsReducer from './notificationsReducer';
import embeddingsReducer from './embeddingsReducer';
import genesReducer from './genesReducer';

import {
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR, UPDATE_CELL_INFO,
} from '../actionTypes';


const diffExprReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_DIFF_EXPR:
      return {
        ...state,
        loading: true,
      };
    case UPDATE_DIFF_EXPR:
      return {
        ...state,
        ...action.data,
        loading: false,
      };
    default:
      return state;
  }
};

const cellInfoReducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_CELL_INFO:
      return {
        ...state,
        ...action.data,
      };
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
  notifications: notificationsReducer,
  embeddings: embeddingsReducer,
  genes: genesReducer,

  diffExpr: diffExprReducer,
  cellInfo: cellInfoReducer,
});
