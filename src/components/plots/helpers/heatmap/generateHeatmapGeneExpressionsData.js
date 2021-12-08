import _ from 'lodash';

import { convertRange } from 'components/plots/helpers/heatmap/utils';

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

const scaledTo255 = (rowOfExpressions) => {
  const min = _.min(rowOfExpressions);
  const max = _.max(rowOfExpressions);

  return rowOfExpressions.map((value) => convertRange(value, [min, max], [0, 255]));
};

const generateVitessceGeneExpressionsData = (data, expression) => {
  const geneExpressionsDataMatrix = [];

  data.geneOrder.forEach((gene) => {
    if (!expression.data[gene]) return;

    // Pick only the
    const geneExpressions = data.cellOrder.map(
      (cellId) => expression.data[gene].rawExpression.expression[cellId],
    );

    const scaledGeneExpressions = scaledTo255(geneExpressions);

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });

  const cellExpressionsData = _.flatten(_.unzip(geneExpressionsDataMatrix));

  return cellExpressionsData;
};

export { generateVegaGeneExpressionsData, generateVitessceGeneExpressionsData };
