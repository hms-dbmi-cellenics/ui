import {
  root as zarrRoot, open,
} from 'zarrita';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

// Generic OME-Zarr pyramid access shared by the histology tile renderer
// (getImageUrls) and the segmentation region decoder (loadSegmentationOverlay).
// Kept in its own module so neither of those imports the other (which would be a
// cycle).

// ── Pyramid open, cached per signed URL ─────────────────────────────────────
// Opening reads only the multiscale metadata + each level's shape (no pixel
// data), so it's cheap; we still cache the opened arrays per URL so the base tile
// and every subsequent viewport tile reuse one open instead of re-reading
// metadata on each zoom. Histology and segmentation are different URLs → distinct
// cache entries.
const pyramidCache = new Map();

export const openOmePyramid = (omeZarrUrl) => {
  if (!pyramidCache.has(omeZarrUrl)) {
    const promise = (async () => {
      const store = ZipFileStore.fromUrl(omeZarrUrl);
      const rootNode = zarrRoot(store);

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

      const { shape } = levels[0];
      return {
        levels,
        axesMetadata,
        fullW: shape[shape.length - 1],
        fullH: shape[shape.length - 2],
      };
    })();
    promise.catch(() => pyramidCache.delete(omeZarrUrl));
    pyramidCache.set(omeZarrUrl, promise);
  }
  return pyramidCache.get(omeZarrUrl);
};

/**
 * Pick the pyramid level + zarr index window for a data-space viewport.
 *
 * `viewport` = { xMin, xMax, yMin, yMax, outputWidth, outputHeight } in level-0
 * data coordinates. The level is the coarsest one that still has at least
 * `outputWidth × outputHeight` pixels across the requested fraction of the slide,
 * so zooming in selects progressively finer levels. The y window is flipped
 * (zarr row 0 = top = high data-y) so cropped tiles align with the y-up plot.
 *
 * Returns null for an empty viewport. `level` is the chosen pyramid index
 * (0 = full resolution); callers compare it to decide whether a detail tile adds
 * any resolution over the coarse base tile.
 */
export const resolvePyramidRegion = (levels, fullW, fullH, viewport) => {
  const {
    xMin, xMax, yMin, yMax, outputWidth, outputHeight,
  } = viewport;

  const vxMin = Math.max(0, Math.floor(xMin));
  const vxMax = Math.min(fullW, Math.ceil(xMax));
  const vyMin = Math.max(0, Math.floor(yMin));
  const vyMax = Math.min(fullH, Math.ceil(yMax));
  if (vxMax <= vxMin || vyMax <= vyMin) return null;

  const fracX = (vxMax - vxMin) / fullW;
  const fracY = (vyMax - vyMin) / fullH;

  let level = 0;
  for (let i = levels.length - 1; i >= 0; i -= 1) {
    const lw = levels[i].shape[levels[i].shape.length - 1];
    const lh = levels[i].shape[levels[i].shape.length - 2];
    if (fracX * lw >= outputWidth && fracY * lh >= outputHeight) {
      level = i;
      break;
    }
  }

  const { shape } = levels[level];
  const ndim = shape.length;
  const lh = shape[ndim - 2];
  const lw = shape[ndim - 1];
  const scaleX = lw / fullW;
  const scaleY = lh / fullH;

  const x0 = Math.max(0, Math.floor(vxMin * scaleX));
  const x1 = Math.min(lw, Math.ceil(vxMax * scaleX));
  const y0 = Math.max(0, Math.floor((fullH - vyMax) * scaleY));
  const y1 = Math.min(lh, Math.ceil((fullH - vyMin) * scaleY));

  const regionW = x1 - x0;
  const regionH = y1 - y0;
  if (regionW <= 0 || regionH <= 0) return null;

  return {
    level,
    shape,
    ndim,
    x0,
    x1,
    y0,
    y1,
    regionW,
    regionH,
    extent: {
      xMin: vxMin, xMax: vxMax, yMin: vyMin, yMax: vyMax,
    },
  };
};
