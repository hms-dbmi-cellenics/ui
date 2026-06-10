import {
  root as zarrRoot, open, get, slice,
} from 'zarrita';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

export const parseHexColor = (hex) => {
  const clean = (hex ?? '').replace('#', '');
  if (clean.length < 6) return [128, 128, 128];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

/**
 * @param {string} segmentationUrl
 * @param {Map<number, [r,g,b]>} cellColorMap  0-indexed cell ID → [r,g,b]
 * @param {object} viewport  { xMin, xMax, yMin, yMax, outputWidth, outputHeight }
 * @param {object} options   { opacity: 0–1, outline: boolean }
 */
const loadSegmentationOverlay = async (segmentationUrl, cellColorMap, viewport, options = {}) => {
  const { opacity = 0.7, outline = false } = options;
  const fillAlpha = Math.round(opacity * 255);

  const {
    xMin, xMax, yMin, yMax, outputWidth, outputHeight,
  } = viewport;

  try {
    const store = ZipFileStore.fromUrl(segmentationUrl);
    const rootNode = zarrRoot(store);

    let datasets = [{ path: '0' }];
    try {
      const rootGroup = await open(rootNode, { kind: 'group' });
      const rootAttrs = await Promise.resolve(rootGroup.attrs);
      datasets = rootAttrs?.multiscales?.[0]?.datasets || datasets;
    } catch (_e) { }

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
    for (let i = levels.length - 1; i >= 0; i--) {
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
    const scaleX = lw / fullW;
    const scaleY = lh / fullH;

    const x0 = Math.max(0, Math.floor(vxMin * scaleX));
    const x1 = Math.min(lw, Math.ceil(vxMax * scaleX));
    const y0 = Math.max(0, Math.floor((fullH - vyMax) * scaleY));
    const y1 = Math.min(lh, Math.ceil((fullH - vyMin) * scaleY));

    const regionW = x1 - x0;
    const regionH = y1 - y0;
    if (regionW <= 0 || regionH <= 0) return null;

    const leadingDims = shape.slice(0, -2).map(() => 0);
    const selection = [...leadingDims, slice(y0, y1), slice(x0, x1)];
    const ndArray = await get(arr, selection);
    const flatData = ndArray.data;

    const canvas = document.createElement('canvas');
    canvas.width = regionW;
    canvas.height = regionH;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(regionW, regionH);
    const px = imgData.data;

    // ── Fill pass ─────────────────────────────────────────────────────────
    for (let i = 0; i < flatData.length; i++) {
      const v = flatData[i];
      const b = i * 4;
      if (v === 0) {
        px[b + 3] = 0; // background → transparent
        continue;
      }
      const color = cellColorMap.get(v - 1); // bitmask is 1-indexed
      if (color) {
        [px[b], px[b + 1], px[b + 2]] = color;
        px[b + 3] = fillAlpha;
      } else {
        // Cell in bitmask but not in active colour scheme → dimmer grey
        px[b] = 128; px[b + 1] = 128; px[b + 2] = 128;
        px[b + 3] = Math.round(fillAlpha * 0.5);
      }
    }

    // ── Outline pass (4-connected edge detection) ─────────────────────────
    // For each non-background pixel whose value differs from at least one
    // 4-connected neighbour, override alpha to 255 so the outline is clearly
    // visible regardless of the current fill opacity.
    if (outline) {
      for (let row = 0; row < regionH; row++) {
        for (let col = 0; col < regionW; col++) {
          const flatIdx = row * regionW + col;
          const v = flatData[flatIdx];
          if (v === 0) continue;

          const top = row > 0 ? flatData[(row - 1) * regionW + col] : 0;
          const bottom = row < regionH - 1 ? flatData[(row + 1) * regionW + col] : 0;
          const left = col > 0 ? flatData[row * regionW + (col - 1)] : 0;
          const right = col < regionW - 1 ? flatData[row * regionW + (col + 1)] : 0;

          if (top !== v || bottom !== v || left !== v || right !== v) {
            px[flatIdx * 4 + 3] = 255; // outline always fully opaque
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      overlayUrl: canvas.toDataURL('image/png'),
      overlayExtent: {
        xMin: vxMin, xMax: vxMax, yMin: vyMin, yMax: vyMax,
      },
    };
  } catch (e) {
    console.error('[loadSegmentationOverlay]', e);
    return null;
  }
};

export default loadSegmentationOverlay;
