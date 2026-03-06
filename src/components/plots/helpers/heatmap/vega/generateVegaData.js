import generateVegaGeneExpressionsData from 'components/plots/helpers/heatmap/vega/utils/generateVegaGeneExpressionsData';
import generateVegaHeatmapTracksData from 'components/plots/helpers/heatmap/vega/utils/generateVegaHeatmapTracksData';
import { reversed } from 'utils/arrayUtils';
import getHeatmapCellOrder, {
  computeHiddenCellSets,
} from 'utils/work/getHeatmapCellOrder';

const generateVegaData = (
  expressionMatrix, heatmapSettings, cellSets,
) => {
  const {
    selectedGenes, selectedTracks, guardLines, selectedCellSet, selectedPoints, groupedTracks,
  } = heatmapSettings;
  const trackOrder = reversed(selectedTracks);

  // Compute which cell sets should be hidden based on selectedPoints
  const hiddenCellSets = computeHiddenCellSets(selectedPoints, cellSets);

  const cellOrder = getHeatmapCellOrder(
    selectedCellSet,
    groupedTracks,
    hiddenCellSets,
    cellSets,
  );

  const data = {
    cellOrder,
    geneOrder: selectedGenes,
    trackOrder,
    geneExpressionsData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  data.geneExpressionsData = generateVegaGeneExpressionsData(
    cellOrder, selectedGenes, expressionMatrix, heatmapSettings,
  );

  const trackData = trackOrder.map(
    (rootNode) => generateVegaHeatmapTracksData(
      cellOrder,
      rootNode,
      cellSets,
      guardLines,
    ),
  );

  data.trackColorData = trackData.map((datum) => datum.trackColorData).flat();
  data.trackGroupData = trackData.map((datum) => datum.groupData).flat();
  data.clusterSeparationLines = trackData.length > 0 ? trackData[0].clusterSeparationLines : [];

  return data;
};

export default generateVegaData;
