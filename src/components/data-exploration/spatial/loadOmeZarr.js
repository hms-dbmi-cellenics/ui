// from https://github.com/vitessce/vitessce/blob/main/packages/utils/spatial-utils/src/load-ome-zarr.js
// should be able to import { loadOmeZarr } from '@vitessce/spatial-utils' but it doesn't work!

import { ZarrPixelSource } from '@hms-dbmi/viv';
import { open as zarrOpen } from 'zarrita';
import { createZarrArrayAdapter, createZarrArrayAdapterGrid } from './createZarrArrayAdapter';

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
    this._readChunks = false;
    this._tileTimes = [];
  }

  async getTile(props) {
    const t0 = performance.now();
    const result = await super.getTile(props);
    const elapsed = performance.now() - t0;

    this._tileTimes.push(elapsed);
    // Log stats every 20 tiles
    if (this._tileTimes.length % 20 === 0) {
      const avg = this._tileTimes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const max = Math.max(...this._tileTimes.slice(-20));
      console.log(`[TilePerf] avg=${avg.toFixed(1)}ms max=${max.toFixed(1)}ms (last 20 tiles)`);
    }
    return result;
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

export async function loadOmeZarrGrid(roots, gridSize) {
  const dataArrays = await Promise.all(roots.map((root) => loadMultiscales(root)));

  const dataGroups = dataArrays.map(({ data }) => data);
  const { rootAttrs } = dataArrays[0]; // Assuming all images have similar metadata
  const { labels } = dataArrays[0]; // Assuming consistent labels across roots

  const tileSize = guessTileSize(dataGroups[0][0]); // Assuming first image for tiling

  // shape of highest resolution in pyramid of first image
  const { shape } = dataGroups[0][0];

  // Create adapters for each image pair in the grid
  const pyramid = dataGroups[0].map((_, resolution) => {
    const arrs = dataGroups.map((group) => group[resolution]);
    return new ZarritaPixelSource(
      createZarrArrayAdapterGrid(arrs, gridSize),
      labels,
      tileSize,
    );
  });

  return {
    data: pyramid,
    metadata: rootAttrs,
    shape,
  };
}
