import getCentroidRadius from 'components/data-exploration/spatial/getCentroidRadius';

// marker.size the spatial plots default to: draws centroid dots at the size of the
// cells they stand for
const DEFAULT_MARKER_SIZE = 20;

/**
 * Size and outline width encodings for the centroid dots drawn when there are no
 * segmentations. A fixed pixel size overlaps heavily for dense data (e.g. Visium HD
 * bins) when zoomed out, so dots are drawn at the size of the cells they stand for,
 * as in Data Exploration (see getCentroidRadius), and follow the zoom. marker.size
 * scales their area relative to the default.
 *
 * @param {Array} plotData points with x and y in data (image) coordinates
 * @param {number} markerSize config.marker.size
 * @returns {object} Vega `size` and `strokeWidth` encodings
 */
const spatialCentroidSize = (plotData, markerSize) => {
  const positions = new Map(plotData.map(({ x, y }, index) => [index, [x, y]]));
  const radius = getCentroidRadius(positions, null);

  if (!radius) return { size: { value: markerSize }, strokeWidth: { value: 1 } };

  const scaledRadius = radius * Math.sqrt(markerSize / DEFAULT_MARKER_SIZE);
  const pixelRadius = `${scaledRadius} * width / span(xdom)`;

  return {
    // symbol size is an area in px², kept at least a pixel so dots stay visible
    size: { signal: `max(1, PI * pow(${pixelRadius}, 2))` },
    // a full pixel outline would double the size of sub-pixel dots
    strokeWidth: { signal: `min(1, 0.5 * ${pixelRadius})` },
  };
};

export default spatialCentroidSize;
