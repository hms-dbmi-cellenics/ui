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

    console.log('[DEBUG] - BEGUN matrix.getTruncatedExpression(gene)');
    const truncatedExpression = matrix.getTruncatedExpression(gene);
    console.log('[DEBUG] - FINISHED matrix.getTruncatedExpression(gene)');

    console.log('[DEBUG] - BEGUN cellOrder.map((cellId) => truncatedExpression[cellId])');
    const geneExpressions = cellOrder.map((cellId) => truncatedExpression[cellId]);
    console.log('[DEBUG] - FINISHED cellOrder.map((cellId) => truncatedExpression[cellId])');

    console.log('[DEBUG] - BEGUN scaledTo255');
    const scaledGeneExpressions = scaledTo255(geneExpressions);
    console.log('[DEBUG] - FINISHED scaledTo255');

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });

  const cellExpressionsData = _.flatten(_.unzip(geneExpressionsDataMatrix));

  return cellExpressionsData;
};

export default generateVitessceHeatmapExpressionsMatrix;
