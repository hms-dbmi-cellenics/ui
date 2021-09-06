/* eslint-disable no-param-reassign */
import { produce } from 'immer';

import initialState from './initialState';

const setNavigationPath = produce((draft, action) => {
  if (draft.processing?.meta) {
    draft.processing.meta.navigationPath = action.payload;
  }
}, initialState);

export default setNavigationPath;
