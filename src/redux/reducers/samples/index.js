import {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_DELETE,
  SAMPLES_FILE_UPDATE,
} from '../../actionTypes/samples';
import initialState from './initialState';
import samplesCreate from './samplesCreate';
import samplesUpdate from './samplesUpdate';
import samplesDelete from './samplesDelete';
import samplesFileUpdate from './samplesFileUpdate';

const samplesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_UPDATE: {
      return samplesUpdate(state, action);
    }

    case SAMPLES_DELETE: {
      return samplesDelete(state, action);
    }

    case SAMPLES_FILE_UPDATE: {
      return samplesFileUpdate(state, action);
    }

    default: {
      return state;
    }
  }
};

export default samplesReducer;
