/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const cellMetaError = produce((draft, action) => {
  const { metaName, error } = action.payload;
  draft[metaName].error = error;
  draft[metaName].loading = false;
}, initialState);

export default cellMetaError;
