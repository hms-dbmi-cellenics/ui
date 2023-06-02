import _ from 'lodash';
import { convertRange } from 'utils/plotUtils';

const scaledTo255 = (rowOfExpressions, min, max) => (
  rowOfExpressions.map((value) => convertRange(value, [min, max], [0, 255]))
);

const generateVitessceHeatmapExpressionsMatrix = (cellOrder, geneOrder, expressionMatrix) => {
  const geneExpressionsDataMatrix = [];

  geneOrder.forEach((gene) => {
    if (!expressionMatrix.geneIsLoaded(gene)) return;
    const truncatedExpression = expressionMatrix.getTruncatedExpression(gene, cellOrder);

    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(gene);

    const scaledGeneExpressions = scaledTo255(truncatedExpression, truncatedMin, truncatedMax);

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });

  return _.flatten(_.unzip(geneExpressionsDataMatrix));
};

export default generateVitessceHeatmapExpressionsMatrix;
