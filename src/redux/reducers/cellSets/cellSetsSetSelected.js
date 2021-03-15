const cellSetsSetSelected = (state, action) => {
  const { keys, tab } = action.payload;

  return {
    ...state,
    selected: {
      ...state.selected,
      [tab]: keys,
    },
  };
};

export default cellSetsSetSelected;
