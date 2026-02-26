import _ from 'lodash';
import { convertRange } from 'utils/plotUtils';

const scaledTo255 = (rowOfExpressions, min, max) => (
  rowOfExpressions.map((value) => convertRange(value, [min, max], [0, 255]))
);

const generateVitessceHeatmapExpressionsMatrix = (cellOrder, geneOrder, expressionMatrix) => {


  const geneExpressionsDataMatrix = [];

  let genesLoaded = 0;
  let genesSkipped = 0;

  geneOrder.forEach((gene) => {
    const isLoaded = expressionMatrix.geneIsLoaded(gene);


    if (!isLoaded) {
      genesSkipped++;
      return;
    }

    genesLoaded++;
    const truncatedExpression = expressionMatrix.getTruncatedExpression(gene, cellOrder);



    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(gene);

    const scaledGeneExpressions = scaledTo255(truncatedExpression, truncatedMin, truncatedMax);

    geneExpressionsDataMatrix.push(scaledGeneExpressions);
  });



  const result = _.flatten(_.unzip(geneExpressionsDataMatrix));


  return result;
};

export default generateVitessceHeatmapExpressionsMatrix;
