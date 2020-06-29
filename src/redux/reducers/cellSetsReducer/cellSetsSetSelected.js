const cellSetsSetSelected = (state, action) => {
  const { keys } = action.payload;

  return {
    ...state,
    selected: keys,
  };
};

export default cellSetsSetSelected;
