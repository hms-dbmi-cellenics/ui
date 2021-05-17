import initialState from './initialState';
import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_UPDATE,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_SAVING,
} from '../../actionTypes/experiments';
import experimentsCreate from './experimentsCreate';
import experimentsUpdate from './experimentsUpdate';
import experimentsError from './experimentsError';
import experimentsSaving from './experimentsSaving';
import exprimentsSaved from './experimentsSaved';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATED: {
      return experimentsCreate(state, action);
    }
    case EXPERIMENTS_UPDATE: {
      return experimentsUpdate(state, action);
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

export default experimentSettingsReducer;
