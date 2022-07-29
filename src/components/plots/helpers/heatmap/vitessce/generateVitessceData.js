import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';

const generateVitessceData = (
  cellOrder, heatmapSettings,
  expression, selectedGenes, cellSets,
) => {
  const { selectedTracks } = heatmapSettings;

  console.log('[DEBUG] - BEGUN generateVitessceHeatmapTracksData');
  const trackColorData = generateVitessceHeatmapTracksData(
    selectedTracks, cellSets, cellOrder,
  );
  console.log('[DEBUG] - FINISHED generateVitessceHeatmapTracksData');

  // Expression matrix is an array
  // with shape [cell_1 gene_1, ..., cell_1 gene_n, cell_2 gene_1, ... ]

  console.log('[DEBUG] - BEGUN generateVitessceHeatmapExpressionsMatrix');
  const expressionMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrder,
    selectedGenes,
    expression,
  );
  console.log('[DEBUG] - FINISHED generateVitessceHeatmapExpressionsMatrix');

  const metadataTracksLabels = selectedTracks
    .map((cellClassKey) => cellSets.properties[cellClassKey].name);

  console.log('[DEBUG] - BEGUN uint8Matrix');
  const uint8Matrix = Uint8Array.from(expressionMatrix);
  console.log('[DEBUG] - FINISHED uint8Matrix');

  return {
    expressionMatrix: {
      cols: selectedGenes,
      rows: cellOrder.map((x) => `${x}`),
      matrix: uint8Matrix,
    },
    metadataTracks: {
      dataPoints: trackColorData,
      labels: metadataTracksLabels,
    },
  };
};

export default generateVitessceData;
