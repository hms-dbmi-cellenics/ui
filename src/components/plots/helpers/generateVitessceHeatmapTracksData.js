import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import { hexToRgb } from 'utils/heatmapPlotHelperFunctions/helpers';

const generateVitessceHeatmapTracksData = (trackOrder, hierarchy, properties, cells) => {
  const colorForCell = (cellId, trackKey) => {
    const { color: cellColor } = getCellClassProperties(cellId, trackKey, hierarchy, properties);
    return hexToRgb(cellColor);
  };

  const cellIdsColorsMap = new Map();

  cells.forEach((cellId) => {
    const allColorsForCell = trackOrder.map((trackKey) => colorForCell(cellId, trackKey));

    cellIdsColorsMap.set(`${cellId}`, allColorsForCell);
  });

  return cellIdsColorsMap;
};

export default generateVitessceHeatmapTracksData;
