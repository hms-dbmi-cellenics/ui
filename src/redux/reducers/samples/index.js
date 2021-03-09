import {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import initialState from './initialState';
import samplesCreate from './samplesCreate';
import samplesUpdate from './samplesUpdate';

const samplesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_UPDATE: {
      return samplesUpdate(state, action);
    }

    default: {
      return state;
    }
  }
};

export default samplesReducer;
