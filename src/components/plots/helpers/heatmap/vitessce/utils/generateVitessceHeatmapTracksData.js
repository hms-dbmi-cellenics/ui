import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import { hexToRgb } from 'utils/plotUtils';

const generateVitessceHeatmapTracksData = (trackOrder, cellSets, cells) => {
  const colorForCell = (cellId, cellClassKey) => {
    const { color: cellColor = null } = getCellClassProperties(
      cellId,
      [cellClassKey],
      cellSets,
    )[0] ?? {};
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
