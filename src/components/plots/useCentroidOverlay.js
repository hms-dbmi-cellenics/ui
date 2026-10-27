import { useEffect, useMemo, useRef } from 'react';

import getCentroidRadius from 'components/data-exploration/spatial/getCentroidRadius';
import { registerDrawable, releaseOverlay } from './loadSegmentationOverlay';

// Longest side of the centroid canvas, in pixels. Bounds its memory for large
// slides (e.g. Visium HD), which then get a few pixels per bin.
const MAX_CANVAS_SIZE = 4096;

// Canvas pixels per cell diameter at most: enough for round Visium spots to stay
// round when zoomed in
const MAX_PIXELS_PER_CELL = 16;

// marker.size the spatial plots default to: draws dots at the size of the cells
// they stand for
const DEFAULT_MARKER_SIZE = 20;

const drawCentroids = (canvas, embeddingData, colorMap, imageHeight, radius, opacity) => {
  const cells = [];
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  colorMap.forEach((color, cellId) => {
    const coordinates = embeddingData[cellId];
    if (!coordinates) return;
    // plot data space is y-up (see the specs' flipped_y)
    const [x, y] = [coordinates[0], imageHeight - coordinates[1]];
    cells.push({ x, y, color });
    xMin = Math.min(xMin, x - radius);
    xMax = Math.max(xMax, x + radius);
    yMin = Math.min(yMin, y - radius);
    yMax = Math.max(yMax, y + radius);
  });
  if (!cells.length) return null;

  const pixelsPerUnit = Math.min(
    MAX_PIXELS_PER_CELL / (2 * radius),
    MAX_CANVAS_SIZE / Math.max(xMax - xMin, yMax - yMin),
  );
  /* eslint-disable no-param-reassign */
  canvas.width = Math.ceil((xMax - xMin) * pixelsPerUnit);
  canvas.height = Math.ceil((yMax - yMin) * pixelsPerUnit);
  /* eslint-enable no-param-reassign */

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = opacity;

  // dots of a few pixels are drawn as squares: much faster, and the same on screen
  const pixelRadius = radius * pixelsPerUnit;
  const asSquares = pixelRadius < 2;

  // one fill style change per color rather than per cell
  const byColor = new Map();
  cells.forEach((cell) => {
    const key = cell.color.join(',');
    if (!byColor.has(key)) byColor.set(key, []);
    byColor.get(key).push(cell);
  });

  byColor.forEach((colorCells, key) => {
    ctx.fillStyle = `rgb(${key})`;
    ctx.beginPath();
    colorCells.forEach(({ x, y }) => {
      const px = (x - xMin) * pixelsPerUnit;
      // canvas rows run top-down
      const py = (yMax - y) * pixelsPerUnit;
      if (asSquares) {
        ctx.rect(px - pixelRadius, py - pixelRadius, 2 * pixelRadius, 2 * pixelRadius);
      } else {
        ctx.moveTo(px + pixelRadius, py);
        ctx.arc(px, py, pixelRadius, 0, 2 * Math.PI);
      }
    });
    ctx.fill();
  });

  return {
    url: registerDrawable(canvas), x1: xMin, x2: xMax, y1: yMin, y2: yMax,
  };
};

/**
 * Centroid dots drawn when there are no segmentations, as rows for the spatial
 * plots' overlay image (like the segmentation overlay tiles). Drawing hundreds of
 * thousands of dots (e.g. Visium HD bins) as Vega symbols makes every zoom step
 * redraw them all; one image is only rescaled. Dots are drawn at the size of the
 * cells they stand for, as in Data Exploration (see getCentroidRadius); marker.size
 * scales their area relative to the default.
 *
 * @param {object} params
 * @param {boolean} params.enabled false when segmentations are shown instead
 * @param {Array} params.embeddingData cellId -> [x, y] in image coordinates
 * @param {Map} params.colorMap cellId -> [r, g, b] of the cells to draw
 * @param {object} params.imageDims { imageHeight } of the plot
 * @param {number} params.opacity 0 to 1
 * @param {number} params.markerSize config.marker.size
 * @returns {Array|null} overlay rows ({ url, x1, x2, y1, y2 }), null if none
 */
const useCentroidOverlay = ({
  enabled, embeddingData, colorMap, imageDims, opacity, markerSize,
}) => {
  const canvasRef = useRef(null);

  // radius only depends on where the cells are, not their colors
  const radius = useMemo(() => {
    if (!enabled || !embeddingData?.length) return null;
    const positions = new Map();
    embeddingData.forEach((coordinates, cellId) => {
      if (coordinates) positions.set(cellId, coordinates);
    });
    return getCentroidRadius(positions, null);
  }, [enabled, embeddingData]);

  const row = useMemo(() => {
    if (!enabled || !radius || !colorMap?.size || !imageDims) return null;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

    const sizeScale = (markerSize ?? DEFAULT_MARKER_SIZE) / DEFAULT_MARKER_SIZE;
    const scaledRadius = radius * Math.sqrt(sizeScale);
    return drawCentroids(
      canvasRef.current, embeddingData, colorMap, imageDims.imageHeight, scaledRadius, opacity,
    );
  }, [enabled, radius, colorMap, imageDims, opacity, markerSize]);

  // release each drawn canvas token once superseded
  useEffect(() => () => releaseOverlay(row?.url), [row]);

  return row ? [row] : null;
};

export default useCentroidOverlay;
