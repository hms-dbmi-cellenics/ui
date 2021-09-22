import { HYDRATE } from 'next-redux-wrapper';
import _ from 'lodash';
import initialState from './initialState';

import {
  BACKEND_STATUS_LOADING,
  BACKEND_STATUS_LOADED,
  BACKEND_STATUS_ERROR,
} from '../../actionTypes/backendStatus';
import { EXPERIMENTS_DELETED } from '../../actionTypes/experiments';
import backendStatusLoading from './backendStatusLoading';
import backendStatusLoaded from './backendStatusLoaded';
import backendStatusError from './backendStatusError';
import experimentsDelete from './experimentsDelete';

const backendStatusReducer = (state = initialState, action) => {
  switch (action.type) {
    case BACKEND_STATUS_LOADING: {
      return backendStatusLoading(state, action);
    }
    case BACKEND_STATUS_LOADED: {
      return backendStatusLoaded(state, action);
    }
    case BACKEND_STATUS_ERROR: {
      return backendStatusError(state, action);
    }
    case EXPERIMENTS_DELETED: {
      return experimentsDelete(state, action);
    }
    case HYDRATE: {
      const { backendStatus } = action.payload;

      if (backendStatus) {
        return _.merge(state, backendStatus);
      }

      return state;
    }
    default: {
      return state;
    }
  }
};

export default backendStatusReducer;
