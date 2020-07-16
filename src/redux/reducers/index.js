/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellSetsReducer from './cellSetsReducer';
import notificationsReducer from './notificationsReducer';
import embeddingsReducer from './embeddingsReducer';
import {
  LOAD_CELLS,
  UPDATE_GENE_LIST, LOAD_GENE_LIST, SELECTED_GENES,
  BUILD_HEATMAP_SPEC, UPDATE_GENE_EXPRESSION, UPDATE_HEATMAP_SPEC,
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR, UPDATE_CELL_INFO, SET_FOCUSED_GENE,
} from '../actionTypes';
import initialSpec from '../../utils/heatmapSpec';

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
      initialSpec.data[0].values = action.data.geneExpressionData
        ? action.data.geneExpressionData.cells : [];
      initialSpec.data[1].values = action.data.geneExpressionData
        ? action.data.geneExpressionData.data : [];
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

const focusedGeneReducer = (state = {}, action) => {
  switch (action.type) {
    case SET_FOCUSED_GENE:
      if (action.data) {
        return {
          ...state,
          cells: action.data.cells,
          expression: action.data.expression,
          geneName: action.data.geneName,
          minExpression: action.data.minExpression,
          maxExpression: action.data.maxExpression,
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

export default combineReducers({
  cellSets: cellSetsReducer,
  notifications: notificationsReducer,
  embeddings: embeddingsReducer,

  cells: cellsReducer,
  geneList: geneListReducer,
  selectedGenes: geneSelectReducer,
  heatmapSpec: heatmapSpecReducer,
  geneExpressionData: heatmapDataReducer,
  diffExpr: diffExprReducer,
  cellInfo: cellInfoReducer,
  focusedGene: focusedGeneReducer,
});
