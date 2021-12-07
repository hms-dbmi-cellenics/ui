const cartesian = (...array) => (
  array.reduce((acum, value) => (
    acum.flatMap((d) => (
      value.map((e) => [d, e].flat())
    ))
  ))
);

const generateVegaGeneExpressionsData = (data, expression, heatmapSettings) => {
  const { expressionValue, truncatedValues } = heatmapSettings;

  const geneExpressionsData = [];

  // Directly generate heatmap data.
  cartesian(
    data.geneOrder, data.cellOrder,
  ).forEach(
    ([gene, cellId]) => {
      const expressionDataForGene = expression.data[gene];

      if (!expressionDataForGene) {
        return;
      }

      let expressionValues = {};

      if (expressionValue === 'zScore') {
        expressionValues = {
          color: expressionDataForGene.zScore, display: expressionDataForGene.zScore,
        };
      } else {
        const { rawExpression, truncatedExpression } = expressionDataForGene;

        expressionValues = {
          color: truncatedValues ? truncatedExpression.expression : rawExpression.expression,
          display: rawExpression.expression,
        };
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
