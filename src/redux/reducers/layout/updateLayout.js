/* eslint-disable no-param-reassign */
import produce from 'immer';
import initialState from './initialState';

const updateLayout = produce((draft, action) => {
  draft.windows = action.payload.windows;
  draft.panel = action.payload.panel;
}, initialState);

export default updateLayout;
