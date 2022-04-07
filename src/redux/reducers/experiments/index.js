import initialState from './initialState';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_DELETED,
} from '../../actionTypes/experiments';

import {
  SAMPLES_CREATE, SAMPLES_DELETE,
} from '../../actionTypes/samples';

import experimentsCreate from './experimentsCreate';
import experimentsUpdate from './experimentsUpdate';
import experimentsDelete from './experimentsDelete';
import experimentsLoading from './experimentsLoading';
import experimentsLoaded from './experimentsLoaded';
import experimentsError from './experimentsError';
import experimentsSaving from './experimentsSaving';

import samplesCreate from './samplesCreate';
import samplesDelete from './samplesDelete';

const experimentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATED: {
      return experimentsCreate(state, action);
    }

    case EXPERIMENTS_UPDATED: {
      return experimentsUpdate(state, action);
    }

    case EXPERIMENTS_DELETED: {
      return experimentsDelete(state, action);
    }

    case EXPERIMENTS_LOADING: {
      return experimentsLoading(state, action);
    }

    case EXPERIMENTS_LOADED: {
      return experimentsLoaded(state, action);
    }

    case EXPERIMENTS_ERROR: {
      return experimentsError(state, action);
    }

    case EXPERIMENTS_SAVING: {
      return experimentsSaving(state, action);
    }

    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_DELETE: {
      return samplesDelete(state, action);
    }

    default: {
      return state;
    }
  }
};

export default experimentsReducer;
