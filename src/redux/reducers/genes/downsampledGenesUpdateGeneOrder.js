const downsampledGenesUpdateGeneOrder = (state, action) => {
  const { orderedGeneNames } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      downsampled: {
        ...state.expression.downsampled,
        orderedGeneNames,
      },
    },
  };
};

export default downsampledGenesUpdateGeneOrder;
