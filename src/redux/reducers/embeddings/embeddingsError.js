/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const embeddingsError = produce((draft, action) => {
  const { embeddingType, error } = action.payload;

  draft[embeddingType].loading = false;
  draft[embeddingType].error = error;
}, initialState);

export default embeddingsError;
