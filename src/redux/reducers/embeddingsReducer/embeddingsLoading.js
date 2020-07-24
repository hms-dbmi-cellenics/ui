import { initialEmbeddingState } from './initialState';

const embeddingsLoading = (state, action) => {
  const { embeddingType } = action.payload;

  return {
    ...state,
    [embeddingType]: {
      ...initialEmbeddingState,
      ...state[embeddingType],
      loading: true,
      error: false,
    },
  };
};

export default embeddingsLoading;
