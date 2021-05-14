import initialState from './initialState';
import {
  EXPERIMENTS_CREATE,
  EXPERIMENTS_UPDATE,
  EXPERIMENTS_ERROR,
} from '../../actionTypes/experiments';
import experimentsCreate from './experimentsCreate';
import experimentsUpdate from './experimentsUpdate';
import experimentsError from './experimentsError';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATE: {
      return experimentsCreate(state, action);
    }
    case EXPERIMENTS_UPDATE: {
      return experimentsUpdate(state, action);
    }
    case EXPERIMENTS_ERROR: {
      return experimentsError(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
