import getInitialState from 'redux/reducers/genes/getInitialState';
import {
  GENES_PROPERTIES_LOADING, GENES_PROPERTIES_LOADED_PAGINATED, GENES_PROPERTIES_ERROR,
  GENES_SELECT, GENES_DESELECT,
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR,
  MARKER_GENES_LOADING, MARKER_GENES_LOADED, MARKER_GENES_ERROR,
  HEATMAP_EXPRESSION_LOADING, HEATMAP_EXPRESSION_LOADED, HEATMAP_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import { EXPERIMENT_SETTINGS_QC_START } from 'redux/actionTypes/experimentSettings';

import genesPropertiesLoading from 'redux/reducers/genes/genesPropertiesLoading';
import genesPropertiesLoadedPaginated from 'redux/reducers/genes/genesPropertiesLoadedPaginated';
import genesPropertiesError from 'redux/reducers/genes/genesPropertiesError';

import genesExpressionLoading from 'redux/reducers/genes/genesExpressionLoading';
import genesExpressionLoaded from 'redux/reducers/genes/genesExpressionLoaded';
import genesExpressionError from 'redux/reducers/genes/genesExpressionError';

import markerGenesLoading from 'redux/reducers/genes/markerGenesLoading';
import markerGenesError from 'redux/reducers/genes/markerGenesError';
import markerGenesLoaded from 'redux/reducers/genes/markerGenesLoaded';

import heatmapExpressionLoading from 'redux/reducers/genes/heatmapExpressionLoading';
import heatmapExpressionLoaded from 'redux/reducers/genes/heatmapExpressionLoaded';
import heatmapExpressionError from 'redux/reducers/genes/heatmapExpressionError';

import genesSelect from 'redux/reducers/genes/genesSelect';
import genesDeselect from 'redux/reducers/genes/genesDeselect';

const genesReducer = (state = getInitialState(), action) => {
  switch (action.type) {
    case GENES_PROPERTIES_LOADING: {
      return genesPropertiesLoading(state, action);
    }
    case GENES_PROPERTIES_LOADED_PAGINATED: {
      return genesPropertiesLoadedPaginated(state, action);
    }
    case GENES_PROPERTIES_ERROR: {
      return genesPropertiesError(state, action);
    }
    case GENES_SELECT: {
      return genesSelect(state, action);
    }
    case GENES_DESELECT: {
      return genesDeselect(state, action);
    }
    case GENES_EXPRESSION_LOADING: {
      return genesExpressionLoading(state, action);
    }
    case GENES_EXPRESSION_LOADED: {
      return genesExpressionLoaded(state, action);
    }
    case GENES_EXPRESSION_ERROR: {
      return genesExpressionError(state, action);
    }
    case EXPERIMENT_SETTINGS_QC_START: {
      return getInitialState();
    }
    case MARKER_GENES_LOADING: {
      return markerGenesLoading(state, action);
    }
    case MARKER_GENES_LOADED: {
      return markerGenesLoaded(state, action);
    }
    case MARKER_GENES_ERROR: {
      return markerGenesError(state, action);
    }
    case HEATMAP_EXPRESSION_LOADING: {
      return heatmapExpressionLoading(state, action);
    }
    case HEATMAP_EXPRESSION_LOADED: {
      return heatmapExpressionLoaded(state, action);
    }
    case HEATMAP_EXPRESSION_ERROR: {
      return heatmapExpressionError(state, action);
    }
    default: {
      return state;
    }
  }
};

export default genesReducer;
