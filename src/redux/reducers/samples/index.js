import {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_ERROR,
} from '../../actionTypes/samples';
import initialState from './initialState';
import samplesCreate from './samplesCreate';
import samplesUpdate from './samplesUpdate';
import samplesFileUpdate from './samplesFileUpdate';
import samplesLoaded from './samplesLoaded';
import samplesError from './samplesError';

const samplesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_UPDATE: {
      return samplesUpdate(state, action);
    }

    case SAMPLES_FILE_UPDATE: {
      return samplesFileUpdate(state, action);
    }

    case SAMPLES_LOADED: {
      return samplesLoaded(state, action);
    }

    case SAMPLES_ERROR: {
      return samplesError(state, action);
    }

    default: {
      return state;
    }
  }
};

export default samplesReducer;
