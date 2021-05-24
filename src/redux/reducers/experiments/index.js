import initialState from './initialState';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATED,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_LOADING,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_SAVING,
} from '../../actionTypes/experiments';
import experimentsCreate from './experimentsCreate';
import experimentsUpdate from './experimentsUpdate';
import experimentsLoading from './experimentsLoading';
import experimentsLoaded from './experimentsLoaded';
import experimentsError from './experimentsError';
import experimentsSaving from './experimentsSaving';
import exprimentsSaved from './experimentsSaved';

const experimentsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATED: {
      return experimentsCreate(state, action);
    }

    case EXPERIMENTS_UPDATED: {
      return experimentsUpdate(state, action);
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

    case EXPERIMENTS_SAVED: {
      return exprimentsSaved(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentsReducer;
