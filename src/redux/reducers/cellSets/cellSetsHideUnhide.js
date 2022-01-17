/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellSetsHide = produce((draft, action) => {
  draft.hidden.add(action.payload.key);
});

const cellSetsUnhide = produce((draft, action) => {
  draft.hidden.delete(action.payload.key);
});

const cellSetsUnhideAll = produce((draft) => {
  draft.hidden = new Set();
});

export { cellSetsHide, cellSetsUnhide, cellSetsUnhideAll };
