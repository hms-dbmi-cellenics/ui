import { initialEmbeddingState } from './initialState';

const embeddingsLoaded = (state, action) => {
  const { embeddingType, data: jsonData } = action.payload;

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
