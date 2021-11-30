import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import { hexToRgb } from 'components/plots/helpers/heatmap/utils';

const generateVitessceHeatmapTracksData = (trackOrder, hierarchy, properties, cells) => {
  const colorForCell = (cellId, cellClassKey) => {
    const { color: cellColor = null } = getCellClassProperties(
      cellId,
      cellClassKey,
      hierarchy,
      properties,
    ) ?? {};

    return hexToRgb(cellColor) ?? hexToRgb('#f5f8fa');
  };

  const cellIdsColorsMap = new Map();

  cells.forEach((cellId) => {
    const allColorsForCell = trackOrder.map((cellClassKey) => colorForCell(cellId, cellClassKey));

    cellIdsColorsMap.set(`${cellId}`, allColorsForCell);
  });

  return cellIdsColorsMap;
};

export default generateVitessceHeatmapTracksData;
