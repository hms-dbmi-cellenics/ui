import {
  CELL_SETS_LOADING, CELL_SETS_LOADED,
  CELL_SETS_CREATE,
  CELL_SETS_UPDATE_PROPERTY, CELL_SETS_SET_SELECTED,
  CELL_SETS_DELETE,
  CELL_SETS_HIDE, CELL_SETS_UNHIDE, CELL_SETS_UNHIDE_ALL,
  CELL_SETS_ERROR,
  CELL_SETS_CLUSTERING_UPDATING, CELL_SETS_CLUSTERING_UPDATED, CELL_SETS_REORDER,
} from '../../actionTypes/cellSets';
import { EXPERIMENT_SETTINGS_PIPELINE_START } from '../../actionTypes/experimentSettings';

import initialState from './initialState';

import cellSetsLoading from './cellSetsLoading';
import cellSetsLoaded from './cellSetsLoaded';
import cellSetsUpdateProperty from './cellSetsUpdateProperty';
import cellSetsDelete from './cellSetsDelete';
import cellSetsReorder from './cellSetsReorder';
import cellSetsCreate from './cellSetsCreate';
import cellSetsSetSelected from './cellSetsSetSelected';
import cellSetsError from './cellSetsError';
import { cellSetsHide, cellSetsUnhide, cellSetsUnhideAll } from './cellSetsHideUnhide';
import cellSetsClusteringUpdating from './cellSetsClusteringUpdating';
import cellSetsClusteringUpdated from './cellSetsClusteringUpdated';

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
    case EXPERIMENT_SETTINGS_PIPELINE_START: {
      return initialState;
    }
    default: {
      return state;
    }
  }
};

export default cellSetsReducer;
