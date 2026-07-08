import { MultiscaleImageLayer } from '@hms-dbmi/viv';
import BitmaskLayer from 'components/data-exploration/spatial/BitmaskLayer';
import parseColor from 'components/data-exploration/parseColor';

// The cell-colour LUT and the per-tile expression buffer are square textures of
// this side length (BITMASK_LUT_SIZE²), indexed by bitmask pixel value (cellId+1).
export const BITMASK_LUT_SIZE = 2048;
const DEFAULT_CELL_GREY = 128;

// Per-tile expression buffer the bitmask shader expects even when not in
// expression mode — a stable all-zero buffer avoids reallocating per layer.
export const DUMMY_EXPRESSION_DATA = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE);

// Stable all-zero RGBA LUT. Alpha=0 throughout → shader discards all pixels.
// Returned by the hover-fill LUT when nothing is hovered to avoid allocating a
// new buffer (and re-uploading the GPU texture) on every hover-clear event.
export const EMPTY_COLOR_LUT = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);

// renderSubLayers callback for the bitmask MultiscaleImageLayers: turns each
// streamed OME-Zarr tile into a BitmaskLayer with normalised bounds.
export function renderSubBitmaskLayers(props) {
  const {
    bbox: {
      left, top, right, bottom,
    },
    index: { x, y, z },
  } = props.tile;
  const { data, id, loader } = props;

  if ([left, bottom, right, top].some((v) => v < 0) || !data) return null;

  const base = loader[0];
  const [imgHeight, imgWidth] = base.shape.slice(-2);

  const bounds = [
    left,
    data.height < base.tileSize ? imgHeight : bottom,
    data.width < base.tileSize ? imgWidth : right,
    top,
  ];

  return new BitmaskLayer(props, {
    channelData: data,
    bounds,
    id: `sub-layer-${bounds}-${id}`,
    tileId: { x, y, z },
    tileWidth: data.width,
    tileHeight: data.height,
  });
}

// Build the RGBA LUT indexed by (cellId+1) for the bitmask shader.
// Cells absent from offsetData (filtered/QC-failed) are never iterated so their
// LUT entries stay [0,0,0,0] → transparent. Cells present but with no colour in
// the active scheme get grey, matching the embedding behaviour.
export const buildCellColorLUT = (offsetData, cellColors, hiddenCellIds, cellsInAnyCluster) => {
  const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);
  if (!offsetData) return lut;

  const hasCellColors = Object.keys(cellColors).length > 0;

  offsetData.forEach((_, cellIdKey) => {
    if (hiddenCellIds.has(cellIdKey)) return;
    if (!cellsInAnyCluster.has(cellIdKey)) return;

    const pixelValue = Number(cellIdKey) + 1;
    if (pixelValue <= 0 || pixelValue >= BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) return;

    let r; let g; let b;
    if (hasCellColors) {
      const colorValue = cellColors[String(cellIdKey)];
      if (colorValue) {
        [r, g, b] = parseColor(colorValue);
      } else {
        r = DEFAULT_CELL_GREY; g = DEFAULT_CELL_GREY; b = DEFAULT_CELL_GREY;
      }
    } else {
      r = DEFAULT_CELL_GREY; g = DEFAULT_CELL_GREY; b = DEFAULT_CELL_GREY;
    }

    lut[pixelValue * 4] = r;
    lut[pixelValue * 4 + 1] = g;
    lut[pixelValue * 4 + 2] = b;
    lut[pixelValue * 4 + 3] = 255;
  });

  return lut;
};

// Build an RGBA LUT colouring every visible cell a single uniform colour — used for
// a flat segmentation backdrop (e.g. white outlines while the molecule overlay
// carries the gene colour).
export const buildUniformColorLUT = (offsetData, color, hiddenCellIds, cellsInAnyCluster) => {
  const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);
  if (!offsetData) return lut;
  const [r, g, b] = color;

  offsetData.forEach((_, cellIdKey) => {
    if (hiddenCellIds.has(cellIdKey)) return;
    if (!cellsInAnyCluster.has(cellIdKey)) return;

    const pixelValue = Number(cellIdKey) + 1;
    if (pixelValue <= 0 || pixelValue >= BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) return;

    lut[pixelValue * 4] = r;
    lut[pixelValue * 4 + 1] = g;
    lut[pixelValue * 4 + 2] = b;
    lut[pixelValue * 4 + 3] = 255;
  });

  return lut;
};

// Single-cell hover LUT: exactly one non-zero entry (the hovered cell, alpha=255);
// every other entry stays transparent. Caller decides when to use EMPTY_COLOR_LUT.
export const buildHoverFillLUT = (selectedCell, cellColors) => {
  const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);
  const pixelValue = Number(selectedCell) + 1;
  if (pixelValue > 0 && pixelValue < BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) {
    const [r, g, b] = parseColor(cellColors[String(selectedCell)]);
    lut[pixelValue * 4] = r;
    lut[pixelValue * 4 + 1] = g;
    lut[pixelValue * 4 + 2] = b;
    lut[pixelValue * 4 + 3] = 255;
  }
  return lut;
};

// Factory for the three near-identical bitmask MultiscaleImageLayers (fill,
// outline, hover-fill). They differ only in id, the colour LUT, the hovered cell
// and whether only outlines are drawn; everything else is shared here.
export const makeBitmaskLayer = ({
  id, loader, cellColorData, hoveredCell, showOutlineOnly, opacity = 0.75,
}) => new MultiscaleImageLayer({
  id,
  loader,
  selections: [{ c: 0 }],
  channelsVisible: [true],
  contrastLimits: [[0, 65535]],
  colors: [[255, 255, 255]],
  opacity,
  visible: true,
  pickable: false,
  renderSubLayers: renderSubBitmaskLayers,
  cellColorData,
  cellTexHeight: BITMASK_LUT_SIZE,
  cellTexWidth: BITMASK_LUT_SIZE,
  hoveredCell,
  showOutlineOnly,
  excludeBackground: true,
  expressionData: DUMMY_EXPRESSION_DATA,
  isExpressionMode: false,
  colorScaleLo: 0,
  colorScaleHi: 1,
  maxRequests: 15,
  maxCacheSize: 512,
});
