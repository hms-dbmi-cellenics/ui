const cartesian = (...array) => (
  array.reduce((acum, value) => (
    acum.flatMap((d) => (
      value.map((e) => [d, e].flat())
    ))
  ))
);

const generateVegaGeneExpressionsData = (
  cellOrder, geneOrder, expressionMatrix, heatmapSettings, cellIdToMatrixIndex = null,
) => {
  const { expressionValue, truncatedValues } = heatmapSettings;

  const geneExpressionsData = [];

  if (!expressionMatrix.genesAreLoaded(geneOrder)) {
    return;
  }

  // For downsampled matrices, cellOrder contains cell IDs but the matrix is indexed
  // by position in workerCellIds. cellIdToMatrixIndex maps cell ID → column index.
  const matrixIndices = cellIdToMatrixIndex
    ? cellOrder.map((id) => cellIdToMatrixIndex.get(id))
    : cellOrder;

  // Preload all genes so that their arrays are generated only once
  const preloadedExpressions = {};
  geneOrder.forEach((gene) => {
    if (expressionValue === 'zScore') {
      preloadedExpressions[gene] = { zScore: expressionMatrix.getZScore(gene, matrixIndices) };
      return;
    }

    const geneExpression = { rawExpression: expressionMatrix.getRawExpression(gene, matrixIndices) };

    if (truncatedValues) {
      geneExpression.truncatedExpression = expressionMatrix.getTruncatedExpression(
        gene, matrixIndices,
      );
    }

    preloadedExpressions[gene] = geneExpression;
  });

  const cellOrderWithIndexes = cellOrder.map((cellId, index) => ({ cellId, index }));

  cartesian(geneOrder, cellOrderWithIndexes).forEach(
    ([gene, { cellId, index }]) => {
      let expressionValues = {};

      if (expressionValue === 'zScore') {
        expressionValues = {
          color: preloadedExpressions[gene].zScore, display: preloadedExpressions[gene].zScore,
        };
      } else {
        expressionValues.display = preloadedExpressions[gene].rawExpression;
        expressionValues.color = truncatedValues
          ? preloadedExpressions[gene].truncatedExpression
          : preloadedExpressions[gene].rawExpression;
      }

      geneExpressionsData.push({
        cellId,
        gene,
        expression: expressionValues.color[index],
        displayExpression: expressionValues.display[index],
      });
    },
  );

  return geneExpressionsData;
};

export default generateVegaGeneExpressionsData;
