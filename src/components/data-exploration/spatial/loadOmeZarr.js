import { ZarrPixelSource } from '@hms-dbmi/viv';
import { open as zarrOpen, slice, get } from 'zarrita';
// Adapted from https://github.com/hms-dbmi/vizarr/blob/5b0e3ea6fbb42d19d0e38e60e49bb73d1aca0693/src/utils.ts#L308

function getV2DataType(dtype) {
  const mapping = {
    int8: '|i1',
    uint8: '|u1',
    int16: '<i2',
    uint16: '<u2',
    int32: '<i4',
    uint32: '<u4',
    int64: '<i8',
    uint64: '<u8',
    float32: '<f4',
    float64: '<f8',
  };
  if (!(dtype in mapping)) {
    throw new Error(`Unsupported dtype ${dtype}`);
  }
  return mapping[dtype];
}

export function createZarrArrayAdapter(arr) {
  return new Proxy(arr, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return (selection) => get(
          target,
          selection ? selection.map((s) => {
            if (typeof s === 'object' && s !== null) {
              return slice(s.start, s.stop, s.step);
            }
            return s;
          }) : target.shape.map(() => null),
        );
      }
      if (prop === 'getRawChunk') {
        throw new Error('getRawChunk should not have been called');
        // TODO: match zarr.js handling of dimension ordering
        // Reference: https://github.com/hms-dbmi/vizarr/pull/172#issuecomment-1714497516
        return (
          selection, options,
        ) => target.getChunk(selection, options.storeOptions);
      }
      if (prop === 'dtype') {
        return getV2DataType(target.dtype);
      }
      return Reflect.get(target, prop);
    },
  });
}

function prevPowerOf2(x) {
  return 2 ** Math.floor(Math.log2(x));
}

/*
 * Helper method to determine whether pixel data is interleaved or not.
 * > isInterleaved([1, 24, 24]) === false;
 * > isInterleaved([1, 24, 24, 3]) === true;
 */
function isInterleaved(shape) {
  const lastDimSize = shape[shape.length - 1];
  return lastDimSize === 3 || lastDimSize === 4;
}

export function guessTileSize(arr) {
  const interleaved = isInterleaved(arr.shape);
  const [yChunk, xChunk] = arr.chunks.slice(interleaved ? -3 : -2);
  const size = Math.min(yChunk, xChunk);
  // deck.gl requirement for power-of-two tile size.
  return prevPowerOf2(size);
}

function isAxis(axisOrLabel) {
  return typeof axisOrLabel[0] !== 'string';
}

async function loadMultiscales(root) {
  const rootAttrs = (await zarrOpen(root)).attrs;

  let paths = ['0'];
  // Default axes used for v0.1 and v0.2.
  let labels = ['t', 'c', 'z', 'y', 'x'];
  if ('multiscales' in rootAttrs) {
    const { datasets, axes } = rootAttrs.multiscales[0];
    paths = datasets.map((d) => d.path);
    if (axes) {
      if (isAxis(axes)) {
        labels = axes.map((axis) => axis.name);
      } else {
        labels = axes;
      }
    }
  }

  const data = paths
    .map((path) => zarrOpen(root.resolve(path), { kind: 'array' }));
  return {
    data: (await Promise.all(data)),
    rootAttrs,
    labels,
  };
}

export class ZarritaPixelSource extends ZarrPixelSource {
  constructor(arr, labels, tileSize) {
    super(arr, labels, tileSize);
    // We prevent reading chunks directly, since Zarrita does not
    // handle x/y chunk differences the same as zarr.js.
    // TODO: fix this once fixed in either zarrita getChunk or
    // in createZarrArrayAdapter.
    // Reference: https://github.com/hms-dbmi/vizarr/pull/172#issuecomment-1714497516
    // eslint-disable-next-line no-underscore-dangle
    this._readChunks = false;
  }
}

// We use our own loadOmeZarr function (instead of viv.loadOmeZarr)
// to bypass usage of zarr.js which is used in Viv's version.
export async function loadOmeZarr(root) {
  const { data, rootAttrs, labels } = await loadMultiscales(root);
  const tileSize = guessTileSize(data[0]);
  const pyramid = data
    .map((arr) => new ZarritaPixelSource(
      createZarrArrayAdapter(arr),
      labels,
      tileSize,
    ));
  return {
    data: pyramid,
    metadata: rootAttrs,
  };
}
