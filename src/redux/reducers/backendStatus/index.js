import initialState from './initialState';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_LOADED,
  BACKEND_STATUS_UPDATED,
  BACKEND_STATUS_ERROR,
} from '../../actionTypes/backendStatus';
import { EXPERIMENTS_DELETED } from '../../actionTypes/experiments';

import experimentsDeleted from './experimentsDeleted';
import backendStatusLoading from './backendStatusLoading';
import backendStatusLoaded from './backendStatusLoaded';
import backendStatusUpdated from './backendStatusUpdated';
import backendStatusError from './backendStatusError';

const backendStatusReducer = (state = initialState, action) => {
  switch (action.type) {
    case BACKEND_STATUS_LOADING: {
      return backendStatusLoading(state, action);
    }
    case BACKEND_STATUS_LOADED: {
      return backendStatusLoaded(state, action);
    }
    case BACKEND_STATUS_UPDATED: {
      return backendStatusUpdated(state, action);
    }
    case BACKEND_STATUS_ERROR: {
      return backendStatusError(state, action);
    }
    case EXPERIMENTS_DELETED: {
      return experimentsDeleted(state, action);
    }
    default: {
      return state;
    }
  }
};

export default backendStatusReducer;
