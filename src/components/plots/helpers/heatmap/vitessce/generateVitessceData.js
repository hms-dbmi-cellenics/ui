import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';

const generateVitessceData = (
  cellOrder, heatmapSettings,
  expression, selectedGenes, cellSets,
) => {
  const { selectedTracks } = heatmapSettings;

  const trackColorData = generateVitessceHeatmapTracksData(
    selectedTracks, cellSets, cellOrder,
  );

  // Expression matrix is an array
  // with shape [cell_1 gene_1, ..., cell_1 gene_n, cell_2 gene_1, ... ]
  const expressionMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrder,
    selectedGenes,
    expression,
  );

  const metadataTracksLabels = selectedTracks
    .map((cellClassKey) => cellSets.properties[cellClassKey].name);

  return {
    expressionMatrix: {
      cols: selectedGenes,
      rows: cellOrder.map((x) => `${x}`),
      matrix: Uint8Array.from(expressionMatrix),
    },
    metadataTracks: {
      dataPoints: trackColorData,
      labels: metadataTracksLabels,
    },
  };
};

export default generateVitessceData;
