/* eslint-disable no-param-reassign */
import produce from 'immer';

const cellInfoUnfocus = produce((draft) => {
  draft.focus.store = null;
  draft.focus.key = null;
});

export default cellInfoUnfocus;
