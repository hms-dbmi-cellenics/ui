import _ from 'lodash';
import { convertRange } from 'utils/plotUtils';

const scaledTo255 = (rowOfExpressions, min, max) => (
  rowOfExpressions.map((value) => convertRange(value, [min, max], [0, 255]))
);

const generateVitessceHeatmapExpressionsMatrix = (
  cellOrder, geneOrder, expressionMatrix, cellIdToMatrixIndex = null,
) => {
  const geneExpressionsDataMatrix = [];

  // For downsampled matrices, cellOrder contains cell IDs, not matrix indices.
  // cellIdToMatrixIndex maps cell ID → column index in the matrix.
  const matrixIndices = cellIdToMatrixIndex
    ? cellOrder.map((id) => cellIdToMatrixIndex.get(id))
    : cellOrder;

  geneOrder.forEach((gene) => {
    const isLoaded = expressionMatrix.geneIsLoaded(gene);

    if (!isLoaded) {
      return;
    }
    const truncatedExpression = expressionMatrix.getTruncatedExpression(gene, matrixIndices);

    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(gene);

    const scaledGeneExpressions = scaledTo255(truncatedExpression, truncatedMin, truncatedMax);

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });

  const result = _.flatten(_.unzip(geneExpressionsDataMatrix));

  return result;
};

export default generateVitessceHeatmapExpressionsMatrix;
