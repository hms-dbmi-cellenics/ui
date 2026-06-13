import {
  root as zarrRoot, open, get, slice,
} from 'zarrita';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';
import { registerDrawable } from './loadSegmentationOverlay';

export const getImageDimensions = async (omeZarrUrl) => {
  try {
    const store = ZipFileStore.fromUrl(omeZarrUrl);
    const rootNode = zarrRoot(store);
    let firstPath = '0';
    try {
      const rootGroup = await open(rootNode, { kind: 'group' });
      const rootAttrs = await Promise.resolve(rootGroup.attrs);
      firstPath = rootAttrs?.multiscales?.[0]?.datasets?.[0]?.path ?? '0';
    } catch (_e) {
      // multiscale metadata is optional — fall back to the default dataset path
    }
    const arr = await open(rootNode.resolve(firstPath), { kind: 'array' });
    const { shape } = arr;
    return {
      imageWidth: shape[shape.length - 1],
      imageHeight: shape[shape.length - 2],
    };
  } catch (e) {
    console.error('[getImageDimensions]', e);
    return null;
  }
};

const getImageUrls = async (omeZarrUrl, viewport) => {
  const {
    xMin, xMax, yMin, yMax, outputWidth, outputHeight,
  } = viewport;

  try {
    const store = ZipFileStore.fromUrl(omeZarrUrl);
    const rootNode = zarrRoot(store);

    // ── Pyramid metadata ──────────────────────────────────────────────────
    let datasets = [{ path: '0' }];
    let axesMetadata = null;
    try {
      const rootGroup = await open(rootNode, { kind: 'group' });
      const rootAttrs = await Promise.resolve(rootGroup.attrs);
      datasets = rootAttrs?.multiscales?.[0]?.datasets || datasets;
      axesMetadata = rootAttrs?.multiscales?.[0]?.axes || null;
    } catch (_e) {
      // multiscale metadata is optional — fall back to the default dataset path
    }

    const levels = await Promise.all(
      datasets.map(async ({ path }) => {
        const arr = await open(rootNode.resolve(path), { kind: 'array' });
        return { arr, shape: arr.shape };
      }),
    );

    const fullH = levels[0].shape[levels[0].shape.length - 2];
    const fullW = levels[0].shape[levels[0].shape.length - 1];

    const vxMin = Math.max(0, Math.floor(xMin));
    const vxMax = Math.min(fullW, Math.ceil(xMax));
    const vyMin = Math.max(0, Math.floor(yMin));
    const vyMax = Math.min(fullH, Math.ceil(yMax));
    if (vxMax <= vxMin || vyMax <= vyMin) return null;

    const fracX = (vxMax - vxMin) / fullW;
    const fracY = (vyMax - vyMin) / fullH;

    // ── Pick pyramid level ────────────────────────────────────────────────
    let chosenIdx = 0;
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      const lw = levels[i].shape[levels[i].shape.length - 1];
      const lh = levels[i].shape[levels[i].shape.length - 2];
      if (fracX * lw >= outputWidth && fracY * lh >= outputHeight) {
        chosenIdx = i;
        break;
      }
    }

    const { arr, shape } = levels[chosenIdx];
    const lh = shape[shape.length - 2];
    const lw = shape[shape.length - 1];
    const ndim = shape.length;
    const scaleX = lw / fullW;
    const scaleY = lh / fullH;

    // ── Find channel axis from metadata, fall back to ndim-3 ─────────────
    let channelAxisIdx = ndim - 3;
    if (axesMetadata) {
      const cIdx = axesMetadata.findIndex((a) => a.type === 'channel' || a.name === 'c');
      if (cIdx >= 0) channelAxisIdx = cIdx;
    }

    // ── Map viewport → zarr indices (y-flip: zarr row 0 = top = high data-y)
    const x0 = Math.max(0, Math.floor(vxMin * scaleX));
    const x1 = Math.min(lw, Math.ceil(vxMax * scaleX));
    const y0 = Math.max(0, Math.floor((fullH - vyMax) * scaleY));
    const y1 = Math.min(lh, Math.ceil((fullH - vyMin) * scaleY));

    const regionW = x1 - x0;
    const regionH = y1 - y0;
    if (regionW <= 0 || regionH <= 0) return null;

    // ── Read RGB channels ─────────────────────────────────────────────────
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

    // ── Build RGBA canvas ─────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = regionW;
    canvas.height = regionH;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(regionW, regionH);
    const px = imgData.data; // Uint8ClampedArray — clamps to [0,255] automatically

    const [rData, gData, bData] = channels;
    for (let i = 0; i < regionW * regionH; i += 1) {
      // Assign directly without normalization — matches the original code.
      // Uint8ClampedArray clamps any value outside [0,255] automatically,
      // so uint8 (0–255) and uint16 data with values in 0–255 range both
      // render correctly. This was the original code's behaviour too.
      px[i * 4] = rData[i];
      px[i * 4 + 1] = gData[i];
      px[i * 4 + 2] = bData[i];
      px[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      // hand Vega the canvas directly (via patchResourceLoader) instead of
      // PNG-encoding it: no toDataURL here, and no re-decode when Vega rebuilds
      // the view (e.g. the first plot adjustment after a zoom). Cached per slide
      // in spatialTileCache, so it's built once and reused across all spatial plots.
      imageUrl: registerDrawable(canvas),
      imageWidth: fullW, // always level-0 full dims for Vega scale domains
      imageHeight: fullH,
      imageExtent: {
        xMin: vxMin, xMax: vxMax, yMin: vyMin, yMax: vyMax,
      },
    };
  } catch (e) {
    console.error('[getImageUrls]', e);
    return null;
  }
};

export default getImageUrls;
