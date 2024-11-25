/* eslint-disable no-param-reassign */
import produce from 'immer';
import { initialLayoutSingleCell } from './initialState';

const updateLayout = produce((draft, action) => {
  draft.windows = action.payload.windows;
  draft.panel = action.payload.panel;
}, initialLayoutSingleCell);

export default updateLayout;
