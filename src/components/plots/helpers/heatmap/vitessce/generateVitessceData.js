import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

const generateVitessceData = (
  selectedTracks,
  expressionMatrix, selectedGenes, cellSets, heatmapSettings,
  preComputedCellOrder = null,
  cellIdToMatrixIndex = null,
) => {
  // Compute cellOrder internally based on heatmap settings, or use the pre-computed value
  // (used for large datasets where the cell order is determined by the worker response).
  const {
    selectedCellSet = 'louvain', groupedTracks = [],
  } = heatmapSettings || {};

  const cellOrder = preComputedCellOrder ?? getHeatmapCellOrder(
    selectedCellSet,
    groupedTracks,
    cellSets.hidden || [],
    cellSets,
  );

  const trackColorData = generateVitessceHeatmapTracksData(
    selectedTracks, cellSets, cellOrder,
  );

  const vitessceMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrder,
    selectedGenes,
    expressionMatrix,
    cellIdToMatrixIndex,
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
