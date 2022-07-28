import _ from 'lodash';
import { convertRange } from 'utils/plotUtils';

const scaledTo255 = (rowOfExpressions) => {
  const min = _.min(rowOfExpressions);
  const max = _.max(rowOfExpressions);

  return rowOfExpressions.map((value) => convertRange(value, [min, max], [0, 255]));
};

const generateVitessceHeatmapExpressionsMatrix = (cellOrder, geneOrder, expression) => {
  const geneExpressionsDataMatrix = [];

  geneOrder.forEach((gene) => {
    const { matrix } = expression;

    if (!matrix.geneIsLoaded(gene)) return;
    // if (!expression.data[gene]) return;

    const truncatedExpression = matrix.getTruncatedExpression(gene);

    const geneExpressions = cellOrder.map(
      (cellId) => {
        const a = truncatedExpression[cellId];
        return a;
        // return matrix.getTruncatedExpression(gene)[cellId]
      },
    );

    const scaledGeneExpressions = scaledTo255(geneExpressions);

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });

  const cellExpressionsData = _.flatten(_.unzip(geneExpressionsDataMatrix));

  return cellExpressionsData;
};

export default generateVitessceHeatmapExpressionsMatrix;
