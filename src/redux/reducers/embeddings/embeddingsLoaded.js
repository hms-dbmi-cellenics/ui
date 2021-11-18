import { initialEmbeddingState } from './initialState';

const embeddingsLoaded = (state, action) => {
  const { embeddingType, data: jsonData, reset = false } = action.payload;

  if (reset) {
    return initialEmbeddingState;
  }
  const data = new Array(jsonData.length);

  jsonData.forEach((value, index) => {
    if (value) {
      data[index] = value;
    }
  });

  return {
    ...state,
    [embeddingType]: {
      ...initialEmbeddingState,
      ...state[embeddingType],
      loading: false,
      data,
    },
  };
};

export default embeddingsLoaded;
