/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const cellMetaLoading = produce((draft, action) => {
  const { metaName } = action.payload;
  draft[metaName].loading = true;
}, initialState);

export default cellMetaLoading;
