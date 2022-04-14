import {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_DELETE_API_V2,
  SAMPLES_DELETE_API_V1,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
  SAMPLES_ERROR,
  SAMPLES_METADATA_DELETE,
  SAMPLES_LOADING,
} from '../../actionTypes/samples';
import initialState from './initialState';
import samplesCreate from './samplesCreate';
import samplesUpdate from './samplesUpdate';
import samplesDelete from './samplesDelete';
import samplesFileUpdate from './samplesFileUpdate';
import samplesLoaded from './samplesLoaded';
import samplesSaving from './samplesSaving';
import samplesError from './samplesError';
import samplesSaved from './samplesSaved';
import samplesMetadataDelete from './samplesMetadataDelete';
import samplesLoading from './samplesLoading';

const samplesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_UPDATE: {
      return samplesUpdate(state, action);
    }

    case SAMPLES_DELETE_API_V2: {
      return samplesDelete(state, action);
    }

    case SAMPLES_DELETE_API_V1: {
      return samplesDelete(state, action);
    }

    case SAMPLES_FILE_UPDATE: {
      return samplesFileUpdate(state, action);
    }

    case SAMPLES_LOADED: {
      return samplesLoaded(state, action);
    }

    case SAMPLES_SAVING: {
      return samplesSaving(state, action);
    }

    case SAMPLES_SAVED: {
      return samplesSaved(state, action);
    }

    case SAMPLES_ERROR: {
      return samplesError(state, action);
    }

    case SAMPLES_METADATA_DELETE: {
      return samplesMetadataDelete(state, action);
    }
    case SAMPLES_LOADING: {
      return samplesLoading(state);
    }
    default: {
      return state;
    }
  }
};

export default samplesReducer;
