import { initialEmbeddingState } from './initialState';

const embeddingsLoading = (state, action) => {
  const { embeddingType } = action.payload;

  return {
    ...state,
    [embeddingType]: {
      ...initialEmbeddingState,
      ...state[embeddingType],
      loading: true,
    },
  };
};

export default embeddingsLoading;
