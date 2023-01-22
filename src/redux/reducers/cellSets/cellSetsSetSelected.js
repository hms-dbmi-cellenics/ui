/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellSetsSetSelected = produce((draft, action) => {
  const { keys } = action.payload;

  draft.selected = keys;
});

export default cellSetsSetSelected;
