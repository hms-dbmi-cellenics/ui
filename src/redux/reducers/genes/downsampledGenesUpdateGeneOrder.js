const downsampledGenesUpdateGeneOrder = (state, action) => {
  const { componentUuid, orderedGeneNames } = action.payload;

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
