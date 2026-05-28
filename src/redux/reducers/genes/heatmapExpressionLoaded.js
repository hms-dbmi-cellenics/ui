const heatmapExpressionLoaded = (state, action) => {
  const {
    newGenes,
    cellIds,
    downsampleType,
    lastFetchSettings,
    isAppend,
  } = action.payload;

  if (newGenes) {
    const { orderedGeneNames, rawExpression, stats } = newGenes;

    if (isAppend) {
      // Only new genes added; matrix column order (cells) is unchanged
      state.expression.downsampled.matrix.pushGeneExpression(
        orderedGeneNames,
        rawExpression,
        stats,
      );
    } else {
      // Full overwrite: reset matrix with new cell set
      state.expression.downsampled.matrix.setGeneExpression(
        orderedGeneNames,
        rawExpression,
        stats,
      );
    }
  }

  return {
    ...state,
    expression: {
      ...state.expression,
      downsampled: {
        ...state.expression.downsampled,
        loading: false,
        error: false,
        ...(!isAppend && newGenes && {
          cellIds,
          downsampleType,
          lastFetchSettings,
        }),
      },
    },
  };
};

export default heatmapExpressionLoaded;

