/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellSetsError = produce((draft, action) => {
  const { error } = action.payload;

  draft.loading = false;
  draft.error = error ?? true;
});

export default cellSetsError;
