import generateVitessceHeatmapExpressionsMatrix from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapExpressionsMatrix';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/vitessce/utils/generateVitessceHeatmapTracksData';
import { union } from 'utils/cellSetOperations';

const generateVitessceData = (
  cellOrder, selectedTracks,
  expressionMatrix, selectedGenes, cellSets,
) => {
  // filter out hidden cells
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

  return {
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
};

export default generateVitessceData;

