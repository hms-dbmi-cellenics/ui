const genesFocus = (state, action) => {
  const { gene } = action.payload;

  return {
    ...state,
    focused: gene,
  };
};

export default genesFocus;
