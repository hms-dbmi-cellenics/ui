import _ from 'lodash';

import { hexToRgb } from 'utils/heatmapPlotHelperFunctions/helpers';

const generateVitessceHeatmapTracksData = (trackOrder, hierarchy, properties, cells) => {
  const cellIdsColorsMap = new Map();

  trackOrder.forEach((trackKey, trackIndex) => {
    const childrenCellSets = _.find(hierarchy, ({ key }) => key === trackKey).children;

    childrenCellSets.forEach(({ key }) => {
      const { cellIds, color } = properties[key];

      const intersectionSet = [cellIds, cells].reduce(
        (acc, curr) => new Set([...acc].filter((x) => curr.has(x))),
      );

      // For each cellId, insert the current trackColor into the map
      intersectionSet.forEach((cellId) => {
        // cellColorsByTrack: [rgbForTrackIndex1, rgbForTrackIndex2, rgbForTrackIndex3, ...]
        const cellColorsByTrack = cellIdsColorsMap.get(`${cellId}`) ?? [];

        cellColorsByTrack[trackIndex] = hexToRgb(color);

        cellIdsColorsMap.set(`${cellId}`, cellColorsByTrack);
      });
    });
  });

  console.log('cellIdsColorsMapDebug');
  console.log(cellIdsColorsMap);

  return cellIdsColorsMap;
};

export default generateVitessceHeatmapTracksData;
