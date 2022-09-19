const cartesian = (...array) => (
  array.reduce((acum, value) => (
    acum.flatMap((d) => (
      value.map((e) => [d, e].flat())
    ))
  ))
);

const generateVegaGeneExpressionsData = (cellOrder, geneOrder, expression, heatmapSettings) => {
  const { expressionValue, truncatedValues } = heatmapSettings;

  const geneExpressionsData = [];

  if (!expression.matrix.genesAreLoaded(geneOrder)) {
    return;
  }

  // Preload all genes so that their arrays are generated only once
  const preloadedExpressions = {};
  geneOrder.forEach((gene) => {
    const geneExpression = { rawExpression: expression.matrix.getRawExpression(gene) };
    geneExpression.truncatedExpression = expression.matrix.getTruncatedExpression(gene);

    preloadedExpressions[gene] = geneExpression;
  });

  cartesian(geneOrder, cellOrder).forEach(
    ([gene, cellId]) => {
      const expressionValues = {};

      if (expressionValue === 'zScore') {
        throw new Error('DO NOT MERGE: Needs to be implemented for sparse matrix in the worker first');
        // expressionValues = {
        //   color: expressionDataForGene.zScore, display: expressionDataForGene.zScore,
        // };
      } else {
        expressionValues.display = preloadedExpressions[gene].rawExpression;
        expressionValues.color = truncatedValues
          ? preloadedExpressions[gene].truncatedExpression
          : preloadedExpressions[gene].display;
      }

      geneExpressionsData.push({
        cellId,
        gene,
        expression: expressionValues.color[cellId],
        displayExpression: expressionValues.display[cellId],
      });
    },
  );

  return geneExpressionsData;
};

export default generateVegaGeneExpressionsData;
