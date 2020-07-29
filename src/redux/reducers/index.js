/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellSetsReducer from './cellSetsReducer';
import notificationsReducer from './notificationsReducer';
import embeddingsReducer from './embeddingsReducer';
import genesReducer from './genesReducer';
import differentialExpressionReducer from './differentialExpressionReducer';

import { UPDATE_CELL_INFO } from '../actionTypes';

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
  differentialExpression: differentialExpressionReducer,
  cellInfo: cellInfoReducer,
});
