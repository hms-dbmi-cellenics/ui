import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';
import getHeatmapCellOrder, {
  computeHiddenCellSets,
} from 'utils/work/getHeatmapCellOrder';

const generateVitessceData = (
  selectedTracks,
  expressionMatrix, selectedGenes, cellSets, heatmapSettings,
) => {
  // Compute cellOrder internally based on heatmap settings
  const {
    selectedCellSet = 'louvain', groupedTracks = [], selectedPoints = 'All',
  } = heatmapSettings || {};

  const hiddenCellSets = computeHiddenCellSets(selectedPoints, cellSets);
  const cellOrder = getHeatmapCellOrder(
    selectedCellSet,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSets,
  );

  const trackColorData = generateVitessceHeatmapTracksData(
    selectedTracks, cellSets, cellOrder,
  );

  const vitessceMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrder,
    selectedGenes,
    expressionMatrix,
  );

  const metadataTracksLabels = selectedTracks
    .map((cellClassKey) => cellSets.properties[cellClassKey].name);

  const result = {
    expressionMatrix: {
      cols: selectedGenes,
      rows: cellOrder.map((x) => `${x}`),
      matrix: Uint8Array.from(vitessceMatrix),
    },
    metadataTracks: {
      dataPoints: trackColorData,
      labels: metadataTracksLabels,
    },
  };

  return result;
};

export default generateVitessceData;
