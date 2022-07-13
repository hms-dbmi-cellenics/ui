import generateVegaGeneExpressionsData from 'components/plots/helpers/heatmap/vega/utils/generateVegaGeneExpressionsData';
import generateVegaHeatmapTracksData from 'components/plots/helpers/heatmap/vega/utils/generateVegaHeatmapTracksData';

const generateVegaData = (
  cellOrder, geneOrder, trackOrder,
  expression, heatmapSettings, cellSets,
) => {
  const data = {
    cellOrder,
    geneOrder,
    trackOrder,
    geneExpressionsData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  data.geneExpressionsData = generateVegaGeneExpressionsData(
    cellOrder, geneOrder, expression, heatmapSettings,
  );

  const trackData = trackOrder.map((rootNode) => generateVegaHeatmapTracksData(
    cellOrder,
    rootNode,
    cellSets,
    heatmapSettings,
  ));

  data.trackColorData = trackData.map((datum) => datum.trackColorData).flat();
  data.trackGroupData = trackData.map((datum) => datum.groupData).flat();
  data.clusterSeparationLines = trackData.length > 0 ? trackData[0].clusterSeparationLines : [];

  return data;
};

export default generateVegaData;
