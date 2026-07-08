import { get, slice } from 'zarrita';
import { openOmePyramid, resolvePyramidRegion } from './zarrPyramid';
import { registerDrawable } from './loadSegmentationOverlay';

export { openOmePyramid } from './zarrPyramid';

/**
 * Decode one RGB histology tile from an already-opened pyramid for the given
 * viewport, returning a canvas handed to Vega via registerDrawable (no PNG
 * round-trip — see loadSegmentationOverlay.patchResourceLoader).
 *
 * @param {object} pyramid   result of openOmePyramid
 * @param {object} viewport  { xMin, xMax, yMin, yMax, outputWidth, outputHeight }
 * @returns {{ imageUrl, imageWidth, imageHeight, imageExtent, level } | null}
 *   imageWidth/imageHeight are always the level-0 full dims (the Vega scale
 *   domains); imageExtent is the data-space rectangle this tile covers; level is
 *   the chosen pyramid index (0 = full resolution).
 */
export const renderImageTile = async (pyramid, viewport) => {
  try {
    const {
      levels, axesMetadata, fullW, fullH,
    } = pyramid;
    const region = resolvePyramidRegion(levels, fullW, fullH, viewport);
    if (!region) return null;

    const {
      level, shape, ndim, x0, x1, y0, y1, regionW, regionH, extent,
    } = region;
    const { arr } = levels[level];

    // ── Find channel axis from metadata, fall back to ndim-3 ────────────────
    let channelAxisIdx = ndim - 3;
    if (axesMetadata) {
      const cIdx = axesMetadata.findIndex((a) => a.type === 'channel' || a.name === 'c');
      if (cIdx >= 0) channelAxisIdx = cIdx;
    }

    // ── Read RGB channels ───────────────────────────────────────────────────
    const channels = await Promise.all([0, 1, 2].map(async (c) => {
      const selection = shape.map((_, dimIdx) => {
        if (dimIdx === channelAxisIdx) return c;
        if (dimIdx === ndim - 2) return slice(y0, y1);
        if (dimIdx === ndim - 1) return slice(x0, x1);
        return 0;
      });
      const ndArray = await get(arr, selection);
      return ndArray.data;
    }));

    // ── Build RGBA canvas ─────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = regionW;
    canvas.height = regionH;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(regionW, regionH);
    const px = imgData.data; // Uint8ClampedArray — clamps to [0,255] automatically

    const [rData, gData, bData] = channels;
    for (let i = 0; i < regionW * regionH; i += 1) {
      // Assign directly without normalization. Uint8ClampedArray clamps any value
      // outside [0,255] automatically, so uint8 (0–255) and uint16 data with values
      // in the 0–255 range both render correctly (matches the original behaviour).
      px[i * 4] = rData[i];
      px[i * 4 + 1] = gData[i];
      px[i * 4 + 2] = bData[i];
      px[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      imageUrl: registerDrawable(canvas),
      imageWidth: fullW, // always level-0 full dims for Vega scale domains
      imageHeight: fullH,
      imageExtent: extent,
      level,
    };
  } catch (e) {
    console.error('[renderImageTile]', e);
    return null;
  }
};

/**
 * Read one histology tile at an EXPLICIT level/pixel window (from tilesForViewport)
 * — used by the viewport tile streamer. Returns a canvas handed to Vega via
 * registerDrawable plus the tile's data-space extent.
 *
 * @param {object} pyramid  result of openOmePyramid
 * @param {object} tile     { level, x0, x1, y0, y1, extent } from tilesForViewport
 * @returns {{ url, extent } | null}
 */
export const readImageTile = async (pyramid, tile) => {
  try {
    const { levels, axesMetadata } = pyramid;
    const {
      level, x0, x1, y0, y1, extent,
    } = tile;
    const { arr, shape } = levels[level];
    const ndim = shape.length;

    let channelAxisIdx = ndim - 3;
    if (axesMetadata) {
      const cIdx = axesMetadata.findIndex((a) => a.type === 'channel' || a.name === 'c');
      if (cIdx >= 0) channelAxisIdx = cIdx;
    }

    const regionW = x1 - x0;
    const regionH = y1 - y0;

    const channels = await Promise.all([0, 1, 2].map(async (c) => {
      const selection = shape.map((_, dimIdx) => {
        if (dimIdx === channelAxisIdx) return c;
        if (dimIdx === ndim - 2) return slice(y0, y1);
        if (dimIdx === ndim - 1) return slice(x0, x1);
        return 0;
      });
      const ndArray = await get(arr, selection);
      return ndArray.data;
    }));

    const canvas = document.createElement('canvas');
    canvas.width = regionW;
    canvas.height = regionH;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(regionW, regionH);
    const px = imgData.data;
    const [rData, gData, bData] = channels;
    for (let i = 0; i < regionW * regionH; i += 1) {
      px[i * 4] = rData[i];
      px[i * 4 + 1] = gData[i];
      px[i * 4 + 2] = bData[i];
      px[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    return { url: registerDrawable(canvas), extent };
  } catch (e) {
    console.error('[readImageTile]', e);
    return null;
  }
};

// Open + render in one call (one-off full-extent loads). Prefer
// openOmePyramid + renderImageTile when issuing many viewport tiles for one slide.
const getImageUrls = async (omeZarrUrl, viewport) => {
  try {
    const pyramid = await openOmePyramid(omeZarrUrl);
    return await renderImageTile(pyramid, viewport);
  } catch (e) {
    console.error('[getImageUrls]', e);
    return null;
  }
};

export default getImageUrls;
