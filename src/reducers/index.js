/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import { LOAD_CELL_SETS, LOAD_CELLS, CELL_SETS_COLOUR } from '../actions/actionType';


const cellSetsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_CELL_SETS:
      // state.data = action.data;
      state.data = [
        {
          color: '#00FF00',
          key: 7,
          name: 'some cells',
        },
      ];
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

const cellSetsColourReducer = (state = {}, action) => {
  switch (action.type) {
    case CELL_SETS_COLOUR:
      state.data = action.data;
      console.log('in the reducer ', state.data);
      return state;
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
  cellSetsColour: cellSetsColourReducer,
  cells: cellsReducer,
});
