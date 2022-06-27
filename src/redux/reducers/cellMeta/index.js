import {
  CELL_META_LOADING,
  CELL_META_LOADED,
  CELL_META_ERROR,
} from '../../actionTypes/cellMeta';
import { EXPERIMENT_SETTINGS_QC_START } from '../../actionTypes/experimentSettings';

import initialState from './initialState';

import cellMetaLoading from './cellMetaLoading';
import cellMetaLoaded from './cellMetaLoaded';
import cellMetaError from './cellMetaError';

const cellMetaReducer = (state = initialState, action) => {
  switch (action.type) {
    case CELL_META_LOADING: {
      return cellMetaLoading(state, action);
    }
    case CELL_META_LOADED: {
      return cellMetaLoaded(state, action);
    }
    case CELL_META_ERROR: {
      return cellMetaError(state, action);
    }
    case EXPERIMENT_SETTINGS_QC_START: {
      return initialState;
    }
    default: {
      return state;
    }
  }
};

export default cellMetaReducer;
