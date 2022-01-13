/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsHide = (state, action) => {
  const { key } = action.payload;

  const newSet = new Set(state.hidden);
  newSet.add(key);

  return {
    ...state,
    hidden: newSet,
  };
};

const cellSetsUnhide = (state, action) => {
  const { key } = action.payload;

  const newSet = new Set(state.hidden);
  newSet.delete(key);

  return {
    ...state,
    hidden: newSet,
  };
};

const cellSetsUnhideAll = (state) => ({
  ...state,
  hidden: initialState.hidden,
});

export { cellSetsHide, cellSetsUnhide, cellSetsUnhideAll };
