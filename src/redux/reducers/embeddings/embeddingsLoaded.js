/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const embeddingsLoaded = produce((draft, action) => {
  const { embeddingType, data: jsonData } = action.payload;

  draft[embeddingType].data = [];
  jsonData.forEach((value, index) => {
    if (value) {
      draft[embeddingType].data[index] = value;
    }
  });

  draft[embeddingType].loading = false;
}, initialState);

export default embeddingsLoaded;
