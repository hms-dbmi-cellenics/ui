/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS,
  CELL_SETS_COLOR, UPDATE_GENE_LIST, LOAD_GENE_LIST, SELECTED_GENES,
  BUILD_HEATMAP_SPEC, UPDATE_GENE_EXPRESSION, UPDATE_HEATMAP_SPEC,
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR, UPDATE_CELL_INFO,
} from '../actions/actionType';
import initialSpec from '../../utils/heatmapSpec';

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
      if (state.data) {
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

const geneSelectReducer = (state = {}, action) => {
  switch (action.type) {
    case SELECTED_GENES:
      return {
        ...state,
        newGenesAdded: action.data.newGenesAdded,
      };
    default:
      return state;
  }
};

const heatmapSpecReducer = (state = {}, action) => {
  switch (action.type) {
    case BUILD_HEATMAP_SPEC:
      initialSpec.data[0].values = action.data.geneExperessionData
        ? action.data.geneExperessionData.cells : [];
      initialSpec.data[1].values = action.data.geneExperessionData
        ? action.data.geneExperessionData.data : [];
      return {
        ...state,
        ...initialSpec,
      };
    case UPDATE_HEATMAP_SPEC:
      if (action.data.rendering) {
        initialSpec.data[1].values = action.data.genes;
        return {
          ...state,
          ...initialSpec,
          rendering: action.data.rendering,
          showAxes: action.data.showAxes,
        };
      }
      return {
        ...state,
        rendering: action.data.rendering,
      };

    default:
      return state;
  }
};

const heatmapDataReducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_GENE_EXPRESSION:
      if (action.data.heatMapData) {
        return {
          ...state,
          ...action.data.heatMapData,
          isLoading: action.data.isLoading,
        };
      }
      return {
        ...state,
        ...action.data,
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
  cellSetsColor: cellSetsColorReducer,
  cells: cellsReducer,
  geneList: geneListReducer,
  selectedGenes: geneSelectReducer,
  heatmapSpec: heatmapSpecReducer,
  geneExperessionData: heatmapDataReducer,
  diffExpr: diffExprReducer,
  cellInfo: cellInfoReducer,
});
