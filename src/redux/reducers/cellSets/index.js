import {
  CELL_SETS_LOADING, CELL_SETS_LOADED,
  CELL_SETS_CREATE,
  CELL_SETS_UPDATE_PROPERTY, CELL_SETS_SET_SELECTED,
  CELL_SETS_DELETE, CELL_CLASS_DELETE,
  CELL_SETS_HIDE, CELL_SETS_UNHIDE, CELL_SETS_UNHIDE_ALL,
  CELL_SETS_ERROR,
  CELL_SETS_CLUSTERING_UPDATING, CELL_SETS_CLUSTERING_UPDATED, CELL_SETS_REORDER,
} from 'redux/actionTypes/cellSets';
import { EXPERIMENT_SETTINGS_QC_START } from 'redux/actionTypes/experimentSettings';

import initialState from 'redux/reducers/cellSets/initialState';

import cellSetsLoading from 'redux/reducers/cellSets/cellSetsLoading';
import cellSetsLoaded from 'redux/reducers/cellSets/cellSetsLoaded';
import cellSetsUpdateProperty from 'redux/reducers/cellSets/cellSetsUpdateProperty';
import cellSetsDelete from 'redux/reducers/cellSets/cellSetsDelete';
import cellClassDelete from 'redux/reducers/cellSets/cellClassDelete';
import cellSetsReorder from 'redux/reducers/cellSets/cellSetsReorder';
import cellSetsCreate from 'redux/reducers/cellSets/cellSetsCreate';
import cellSetsSetSelected from 'redux/reducers/cellSets/cellSetsSetSelected';
import cellSetsError from 'redux/reducers/cellSets/cellSetsError';
import { cellSetsHide, cellSetsUnhide, cellSetsUnhideAll } from 'redux/reducers/cellSets/cellSetsHideUnhide';
import cellSetsClusteringUpdating from 'redux/reducers/cellSets/cellSetsClusteringUpdating';
import cellSetsClusteringUpdated from 'redux/reducers/cellSets/cellSetsClusteringUpdated';

const cellSetsReducer = (state = initialState, action) => {
  switch (action.type) {
    case CELL_SETS_LOADING: {
      return cellSetsLoading(state, action);
    }
    case CELL_SETS_LOADED: {
      return cellSetsLoaded(state, action);
    }
    case CELL_SETS_UPDATE_PROPERTY: {
      return cellSetsUpdateProperty(state, action);
    }
    case CELL_SETS_DELETE: {
      return cellSetsDelete(state, action);
    }
    case CELL_CLASS_DELETE: {
      return cellClassDelete(state, action);
    }
    case CELL_SETS_REORDER: {
      return cellSetsReorder(state, action);
    }
    case CELL_SETS_CREATE: {
      return cellSetsCreate(state, action);
    }
    case CELL_SETS_SET_SELECTED: {
      return cellSetsSetSelected(state, action);
    }
    case CELL_SETS_HIDE: {
      return cellSetsHide(state, action);
    }
    case CELL_SETS_UNHIDE: {
      return cellSetsUnhide(state, action);
    }
    case CELL_SETS_UNHIDE_ALL: {
      return cellSetsUnhideAll(state, action);
    }
    case CELL_SETS_CLUSTERING_UPDATING: {
      return cellSetsClusteringUpdating(state, action);
    }
    case CELL_SETS_CLUSTERING_UPDATED: {
      return cellSetsClusteringUpdated(state, action);
    }
    case CELL_SETS_ERROR: {
      return cellSetsError(state, action);
    }
    case EXPERIMENT_SETTINGS_QC_START: {
      return initialState;
    }
    default: {
      return state;
    }
  }
};

export default cellSetsReducer;
