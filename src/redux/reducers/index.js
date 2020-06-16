/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS,
  CELL_SETS_COLOR, UPDATE_GENE_LIST, LOAD_GENE_LIST,
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
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
      // in the future, we will need to handle that case too.
      if (!state.data) {
        // Find scratchpad at top level and add the new cluster.
        // The assignment is necessary because otherwise `useSelector`
        // won't recognize the changed state and the cell set tool won't rerender.

        state.data = state.data.map((topCategory) => {
          if (topCategory.key === 'scratchpad') {
            if (!topCategory.children) {
              topCategory.children = [];
            }

            topCategory.children.push(action.data);
          }

          return topCategory;
        });
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

export default combineReducers({
  cellSets: cellSetsReducer,
  cellSetsColor: cellSetsColorReducer,
  cells: cellsReducer,
  geneList: geneListReducer,
  diffExpr: diffExprReducer,
});
