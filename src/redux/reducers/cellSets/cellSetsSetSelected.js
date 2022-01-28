/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellSetsSetSelected = produce((draft, action) => {
  const { keys, tab } = action.payload;

  draft.selected[tab] = keys;
});

export default cellSetsSetSelected;
