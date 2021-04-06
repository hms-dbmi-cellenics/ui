import initialState from './initialState';
import {
  EMBEDDINGS_LOADED,
  EMBEDDINGS_LOADING,
  EMBEDDINGS_ERROR,
  EMBEDDINGS_RESET,
} from '../../actionTypes/embeddings';
import embeddingsLoading from './embeddingsLoading';
import embeddingsLoaded from './embeddingsLoaded';
import embeddingsError from './embeddingsError';
import embeddingsReset from './embeddingsReset';

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

    case EMBEDDINGS_RESET: {
      return embeddingsReset(state, action);
    }

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
