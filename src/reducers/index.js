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
          key: '58',
          name: 'some cells',
          cellIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
        },
        {
          color: '#0000FF',
          key: '59',
          name: 'some other cells',
          cellIds: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
        },
        {
          color: '#FF0000',
          key: '60',
          name: 'more cells',
          cellIds: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
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
