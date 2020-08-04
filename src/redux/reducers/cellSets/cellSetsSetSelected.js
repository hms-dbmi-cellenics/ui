const cellSetsSetSelected = (state, action) => {
  const { keys, loadingColors } = action.payload;

  return {
    ...state,
    loadingColors,
    selected: keys,
  };
};

export default cellSetsSetSelected;
