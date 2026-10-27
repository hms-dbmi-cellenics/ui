import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import _ from 'lodash';

import getCentroidRadius from 'components/data-exploration/spatial/getCentroidRadius';
import { registerDrawable, releaseOverlay } from './loadSegmentationOverlay';

// Longest side of a centroid canvas, in pixels. Bounds the memory of the whole
// slide image for large slides (e.g. Visium HD), which then get a few pixels per
// bin; zooming in draws the view sharper (see the detail image below).
const MAX_CANVAS_SIZE = 4096;

// Canvas pixels per cell diameter at most in the whole slide image: enough for
// round Visium spots to stay round
const MAX_PIXELS_PER_CELL = 16;

// Dots filled per canvas path
const MAX_SHAPES_PER_FILL = 10000;

// marker.size the spatial plots default to: draws dots at the size of the cells
// they stand for
const DEFAULT_MARKER_SIZE = 20;

// The detail image covers the view plus this fraction of it on each side, so
// panning a little shows sharp dots straight away
const DETAIL_MARGIN = 0.25;

// Wait for zooming/panning to pause before drawing the detail image
const DETAIL_DEBOUNCE_MS = 150;

// Cells in the plot's data space (y-up, see the specs' flipped_y) grouped by
// color, so each color's fill style is set once, with the area they cover
const layoutCells = (embeddingData, colorMap, imageHeight, radius) => {
  const byColor = new Map();
  const bounds = {
    xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity,
  };

  colorMap.forEach((color, cellId) => {
    const coordinates = embeddingData[cellId];
    if (!coordinates) return;

    const x = coordinates[0];
    const y = imageHeight - coordinates[1];
    const key = color.join(',');
    if (!byColor.has(key)) byColor.set(key, []);
    byColor.get(key).push([x, y]);

    bounds.xMin = Math.min(bounds.xMin, x - radius);
    bounds.xMax = Math.max(bounds.xMax, x + radius);
    bounds.yMin = Math.min(bounds.yMin, y - radius);
    bounds.yMax = Math.max(bounds.yMax, y + radius);
  });

  return byColor.size ? { byColor, bounds } : null;
};

// Draw the cells within `region` (data space) onto `canvas` at `pixelsPerUnit`,
// returning the overlay row that places it in the plot
const drawRegion = (canvas, layout, radius, opacity, region, pixelsPerUnit) => {
  const {
    xMin, xMax, yMin, yMax,
  } = region;

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

  layout.byColor.forEach((cells, key) => {
    ctx.fillStyle = `rgb(${key})`;
    ctx.beginPath();
    let shapes = 0;
    cells.forEach(([x, y]) => {
      if (x + radius < xMin || x - radius > xMax || y + radius < yMin || y - radius > yMax) {
        return;
      }

      const px = (x - xMin) * pixelsPerUnit;
      // canvas rows run top-down
      const py = (yMax - y) * pixelsPerUnit;
      if (asSquares) {
        ctx.rect(px - pixelRadius, py - pixelRadius, 2 * pixelRadius, 2 * pixelRadius);
      } else {
        ctx.moveTo(px + pixelRadius, py);
        ctx.arc(px, py, pixelRadius, 0, 2 * Math.PI);
      }

      // browsers silently skip filling paths of too many shapes, e.g. the hundreds
      // of thousands of cells that don't express a gene
      shapes += 1;
      if (shapes % MAX_SHAPES_PER_FILL === 0) {
        ctx.fill();
        ctx.beginPath();
      }
    });
    ctx.fill();
  });

  return {
    url: registerDrawable(canvas), x1: xMin, x2: xMax, y1: yMin, y2: yMax,
  };
};

const span = (region) => Math.max(region.xMax - region.xMin, region.yMax - region.yMin);

/**
 * Centroid dots drawn when there are no segmentations, as rows for the spatial
 * plots' overlay image (like the segmentation overlay tiles). Drawing hundreds of
 * thousands of dots (e.g. Visium HD bins) as Vega symbols makes every zoom step
 * redraw them all; an image is only rescaled. Dots are drawn at the size of the
 * cells they stand for, as in Data Exploration (see getCentroidRadius); marker.size
 * scales their area relative to the default.
 *
 * The whole slide is one image. Once zooming in pauses, the view is also drawn at
 * screen resolution, shown alone at rest so the coarser whole slide image doesn't
 * blur its edges, and over it while zooming or panning so nothing goes blank.
 *
 * @param {object} params
 * @param {boolean} params.enabled false when segmentations are shown instead
 * @param {Array} params.embeddingData cellId -> [x, y] in image coordinates
 * @param {Map} params.colorMap cellId -> [r, g, b] of the cells to draw
 * @param {object} params.imageDims { imageHeight } of the plot
 * @param {number} params.opacity 0 to 1
 * @param {number} params.markerSize config.marker.size
 * @param {number} params.plotWidth plot width on screen, in pixels
 * @param {number} params.plotHeight plot height on screen, in pixels
 * @returns {{ overlayData: Array|null, onViewportChange: Function }} overlay rows
 *  ({ url, x1, x2, y1, y2 }, null if none), and the handler to call with the
 *  plot's x and y domains whenever they change
 */
const useCentroidOverlay = ({
  enabled, embeddingData, colorMap, imageDims, opacity, markerSize, plotWidth, plotHeight,
}) => {
  const baseCanvasRef = useRef(null);
  const detailCanvasRef = useRef(null);
  const [viewport, setViewport] = useState(null);
  const [moving, setMoving] = useState(false);

  const settle = useMemo(() => _.debounce((xdom, ydom) => {
    setViewport({
      xMin: xdom[0], xMax: xdom[1], yMin: ydom[0], yMax: ydom[1],
    });
    setMoving(false);
  }, DETAIL_DEBOUNCE_MS), []);
  useEffect(() => () => settle.cancel(), [settle]);

  const onViewportChange = useCallback((xdom, ydom) => {
    setMoving(true);
    settle(xdom, ydom);
  }, [settle]);

  // radius only depends on where the cells are, not their colors
  const radius = useMemo(() => {
    if (!enabled || !embeddingData?.length) return null;
    const positions = new Map();
    embeddingData.forEach((coordinates, cellId) => {
      if (coordinates) positions.set(cellId, coordinates);
    });
    const cellRadius = getCentroidRadius(positions, null);
    const sizeScale = (markerSize ?? DEFAULT_MARKER_SIZE) / DEFAULT_MARKER_SIZE;
    return cellRadius && cellRadius * Math.sqrt(sizeScale);
  }, [enabled, embeddingData, markerSize]);

  const layout = useMemo(() => {
    if (!enabled || !radius || !colorMap?.size || !imageDims) return null;
    return layoutCells(embeddingData, colorMap, imageDims.imageHeight, radius);
  }, [enabled, radius, colorMap, imageDims]);

  const basePixelsPerUnit = layout && Math.min(
    MAX_PIXELS_PER_CELL / (2 * radius),
    MAX_CANVAS_SIZE / span(layout.bounds),
  );

  const baseRow = useMemo(() => {
    if (!layout) return null;
    if (!baseCanvasRef.current) baseCanvasRef.current = document.createElement('canvas');
    return drawRegion(
      baseCanvasRef.current, layout, radius, opacity, layout.bounds, basePixelsPerUnit,
    );
  }, [layout, opacity]);

  const detailRow = useMemo(() => {
    if (!layout || !viewport || !plotWidth || !plotHeight) return null;

    const screenPixelsPerUnit = Math.max(
      plotWidth / (viewport.xMax - viewport.xMin),
      plotHeight / (viewport.yMax - viewport.yMin),
    ) * (window.devicePixelRatio || 1);
    // zoomed out far enough that the whole slide image is sharp
    if (screenPixelsPerUnit <= basePixelsPerUnit) return null;

    const marginX = (viewport.xMax - viewport.xMin) * DETAIL_MARGIN;
    const marginY = (viewport.yMax - viewport.yMin) * DETAIL_MARGIN;
    const { bounds } = layout;
    const region = {
      xMin: Math.max(bounds.xMin, viewport.xMin - marginX),
      xMax: Math.min(bounds.xMax, viewport.xMax + marginX),
      yMin: Math.max(bounds.yMin, viewport.yMin - marginY),
      yMax: Math.min(bounds.yMax, viewport.yMax + marginY),
    };
    if (region.xMin >= region.xMax || region.yMin >= region.yMax) return null;

    if (!detailCanvasRef.current) detailCanvasRef.current = document.createElement('canvas');
    return drawRegion(
      detailCanvasRef.current, layout, radius, opacity, region,
      Math.min(screenPixelsPerUnit, MAX_CANVAS_SIZE / span(region)),
    );
  }, [layout, opacity, viewport, plotWidth, plotHeight]);

  // release each drawn canvas token once superseded
  useEffect(() => () => releaseOverlay(baseRow?.url), [baseRow]);
  useEffect(() => () => releaseOverlay(detailRow?.url), [detailRow]);

  const overlayData = useMemo(() => {
    if (!baseRow) return null;
    if (!detailRow) return [baseRow];
    return moving ? [baseRow, detailRow] : [detailRow];
  }, [baseRow, detailRow, moving]);

  return { overlayData, onViewportChange };
};

export default useCentroidOverlay;
