/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import { LOAD_CELL_SETS } from '../actions/actionType';


const cellSetsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_CELL_SETS:
      state.data = action.data;
      return state;
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
});
