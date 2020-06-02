/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS,
  CELL_SETS_COLOR, UPDATE_GENE_LIST, LOAD_GENE_LIST,
} from '../actions/actionType';


const cellSetsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_CELL_SETS:
      state.data = action.data;
      return state;
    case UPDATE_CELL_SETS:
      state.data = action.data;
      return state;
    case CREATE_CLUSTER:
      // for now, if cell set tool is not opened yet, we do nothing on create cell set action
      // in the future, we will need to handle that case too
      if (typeof state.data !== 'undefined') {
        state.data = [...state.data, action.data];
      }
      return state;
    default:
      return state;
  }
};

const cellSetsColorReducer = (state = {}, action) => {
  switch (action.type) {
    case CELL_SETS_COLOR:
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

const geneListReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_GENE_LIST:
      console.log({
        ...state,
        loading: true,
      });
      return {
        ...state,
        loading: true,
      };
    case UPDATE_GENE_LIST:
      return {
        ...state,
        ...action.data,
        loading: false,
      };
    default:
      return state;
  }
};

export default combineReducers({
  cellSets: cellSetsReducer,
  cellSetsColor: cellSetsColorReducer,
  cells: cellsReducer,
  geneList: geneListReducer,
});
