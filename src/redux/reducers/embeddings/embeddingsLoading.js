/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const embeddingsLoading = produce((draft, action) => {
  const { embeddingType } = action.payload;
  draft[embeddingType] = {
    loading: true,
    error: false,
  };
}, initialState);

export default embeddingsLoading;
