/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState, { initialEmbeddingState } from './initialState';

const embeddingsError = produce((draft, action) => {
  const { embeddingType, error } = action.payload;

  draft[embeddingType] = {
    ...initialEmbeddingState,
    loading: false,
    error,
  };
}, initialState);

export default embeddingsError;
