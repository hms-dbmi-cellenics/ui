import { WebMercatorViewport } from '@deck.gl/core';

const INITIAL_ZOOM = 3.5;

/**
 * Calculate optimal zoom level and center to fit all cells in viewport
 * Returns null if no cell data is available
 */
const calculateInitialViewState = (cellData, containerWidth, containerHeight) => {
  if (!cellData || cellData.length === 0) {
    return null;
  }

  // Find bounds of all cell positions
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  cellData.forEach((cell) => {
    const [x, y] = cell.position;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  // Use deck.gl's WebMercatorViewport to fit bounds
  // fitBounds expects [[minLng, minLat], [maxLng, maxLat]] format
  const bounds = [[minX, minY], [maxX, maxY]];
  const viewport = new WebMercatorViewport({
    width: containerWidth,
    height: containerHeight,
  });

  const fitted = viewport.fitBounds(bounds, { padding: 0 });

  // adding some magic multiples to better fit data
  // determined empirically
  return {
    longitude: fitted.longitude,
    latitude: fitted.latitude * 0.80,
    zoom: fitted.zoom * 0.90,
    pitch: 0,
    bearing: 0,
  };
};

export default calculateInitialViewState;
export { INITIAL_ZOOM };
