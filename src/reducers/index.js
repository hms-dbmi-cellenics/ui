/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import { LOAD_CELL_SETS, LOAD_CELLS } from '../actions/actionType';


const cellSetsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_CELL_SETS:
      state.data = action.data;
      return state;
    default:
      return state;
  }
};

const cellsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_CELLS:
      state.data = action.data;
      return state;
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
  cells: cellsReducer,
});
