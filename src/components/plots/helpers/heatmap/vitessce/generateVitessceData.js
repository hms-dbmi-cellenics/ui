import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';
import { union } from 'utils/cellSetOperations';
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

  // filter out hidden cells (in addition to what getHeatmapCellOrder handles)
  const hiddenCells = union([...cellSets.hidden], cellSets.properties);
  const cellOrderFiltered = cellOrder.filter((cell) => !hiddenCells.has(cell));

  const trackColorData = generateVitessceHeatmapTracksData(
    selectedTracks, cellSets, cellOrderFiltered,
  );

  const vitessceMatrix = generateVitessceHeatmapExpressionsMatrix(
    cellOrderFiltered,
    selectedGenes,
    expressionMatrix,
  );

  const metadataTracksLabels = selectedTracks
    .map((cellClassKey) => cellSets.properties[cellClassKey].name);

  const result = {
    expressionMatrix: {
      cols: selectedGenes,
      rows: cellOrderFiltered.map((x) => `${x}`),
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
