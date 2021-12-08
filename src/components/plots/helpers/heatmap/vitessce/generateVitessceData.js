import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';

const generateVitessceData = (
  cellOrder, geneOrder, trackOrder,
  expression, heatmapSettings, cellSets,
) => {
  const cells = new Set(cellOrder);

  const trackColorData = generateVitessceHeatmapTracksData(
    trackOrder, cellSets.hierarchy, cellSets.properties, cells,
  );

  // Data points is an array with shape [cell_1 gene_1, ..., cell_1 gene_n, cell_2 gene_1, ... ]
  const expressionMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrder,
    geneOrder,
    expression,
  );

  return {
    expressionMatrix: {
      cols: geneOrder,
      rows: cellOrder.map((x) => `${x}`),
      matrix: Uint8Array.from(expressionMatrix),
    },
    metadataTracks: {
      dataPoints: trackColorData,
      labels: Array.from(heatmapSettings.selectedTracks).reverse(),
    },
  };
};

export default generateVitessceData;
