/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState, { initialEmbeddingState } from './initialState';

const embeddingsLoaded = produce((draft, action) => {
  const { embeddingType, data: jsonData } = action.payload;

  draft[embeddingType] = {
    ...initialEmbeddingState,
    loading: false,
  };

  const data = [];
  jsonData.forEach((value, index) => {
    if (value) {
      data[index] = value;
    }
  });
  draft[embeddingType].data = data;
}, initialState);

export default embeddingsLoaded;
