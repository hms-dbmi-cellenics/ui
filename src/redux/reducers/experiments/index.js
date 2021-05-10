import initialState from './initialState';
import {
  EXPERIMENTS_CREATE,
  EXPERIMENTS_UPDATE,
} from '../../actionTypes/experiments';
import experimentCreate from './experimentsCreate';
import experimentUpdate from './experimentsUpdate';

const experimentSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EXPERIMENTS_CREATE: {
      return experimentCreate(state, action);
    }
    case EXPERIMENTS_UPDATE: {
      return experimentUpdate(state, action);
    }
    default: {
      return state;
    }
  }
};

export default experimentSettingsReducer;
