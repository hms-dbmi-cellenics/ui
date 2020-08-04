import {
  CELL_SETS_LOADING, CELL_SETS_LOADED,
  CELL_SETS_CREATE,
  CELL_SETS_UPDATE_PROPERTY, CELL_SETS_UPDATE_HIERARCHY, CELL_SETS_SET_SELECTED,
  CELL_SETS_DELETE,
  CELL_SETS_ERROR,
} from '../../actionTypes/cellSets';

import initialState from './initialState';

import cellSetsLoading from './cellSetsLoading';
import cellSetsLoaded from './cellSetsLoaded';
import cellSetsUpdateProperty from './cellSetsUpdateProperty';
import cellSetsDelete from './cellSetsDelete';
import cellSetsUpdateHierarchy from './cellSetsUpdateHierarchy';
import cellSetsCreate from './cellSetsCreate';
import cellSetsSetSelected from './cellSetsSetSelected';
import cellSetsError from './cellSetsError';

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

    case CELL_SETS_UPDATE_HIERARCHY: {
      return cellSetsUpdateHierarchy(state, action);
    }

    case CELL_SETS_CREATE: {
      return cellSetsCreate(state, action);
    }

    case CELL_SETS_SET_SELECTED: {
      return cellSetsSetSelected(state, action);
    }

    case CELL_SETS_ERROR: {
      return cellSetsError(state, action);
    }

    default: {
      return state;
    }
  }
};

export default cellSetsReducer;
