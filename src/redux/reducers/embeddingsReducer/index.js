import initialState from './initialState';
import { EMBEDDINGS_LOADED, EMBEDDINGS_LOADING, EMBEDDINGS_ERROR } from '../../actionTypes/embeddings';
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

    default: {
      return state;
    }
  }
};

export default notificationsReducer;
