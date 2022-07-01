import initialState from './initialState';
import {
  EMBEDDINGS_LOADED,
  EMBEDDINGS_LOADING,
  EMBEDDINGS_ERROR,
} from '../../actionTypes/embeddings';

import { EXPERIMENT_SETTINGS_QC_START } from '../../actionTypes/experimentSettings';

import embeddingsLoading from './embeddingsLoading';
import embeddingsLoaded from './embeddingsLoaded';
import embeddingsError from './embeddingsError';

const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case EMBEDDINGS_LOADING: {
      return embeddingsLoading(state, action);
    }

    case EMBEDDINGS_LOADED: {
      return embeddingsLoaded(state, action);
    }

    case EMBEDDINGS_ERROR: {
      return embeddingsError(state, action);
    }

    case EXPERIMENT_SETTINGS_QC_START: {
      return initialState;
    }

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
