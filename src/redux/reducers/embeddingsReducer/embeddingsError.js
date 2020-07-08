import { initialEmbeddingState } from './initialState';

const embeddingsError = (state, action) => {
  const { embeddingType, error } = action.payload;

  return {
    ...state,
    [embeddingType]: {
      ...initialEmbeddingState,
      ...state[embeddingType],
      loading: false,
      error,
    },
  };
};

export default embeddingsError;
