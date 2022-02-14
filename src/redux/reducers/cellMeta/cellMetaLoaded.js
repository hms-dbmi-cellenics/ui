/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const cellMetaLoaded = produce((draft, action) => {
  const { metaName, data } = action.payload;

  draft[metaName].data = data;
  draft[metaName].loading = false;
  draft[metaName].error = false;
}, initialState);

export default cellMetaLoaded;
