// from https://github.com/vitessce/vitessce/blob/main/packages/utils/zarr-utils/src/adapter.ts
// should be able to import { createZarrArrayAdapter } from '@vitessce/zarr-utils' but it doesn't work!

import { slice, get } from 'zarrita';

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

// eslint-disable-next-line import/prefer-default-export
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
        // eslint-disable-next-line no-unreachable
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

export function createZarrArrayAdapterGrid(arrs, [n, p]) {
  const firstArray = arrs[0];

  return new Proxy(firstArray, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return async (selection) => {
          const { shape } = firstArray;
          const [heightPerImage, widthPerImage] = shape.slice(-2);

          if (selection) {
            // Account for full range in any dimension marked by null
            const gridSelection = [
              selection[0],
              { start: 0, stop: heightPerImage * n, step: 1 },
              { start: 0, stop: widthPerImage * p, step: 1 },
            ];

            const normalizedSelection = selection.map((s, i) => s ?? gridSelection[i]);

            // get x and y ranges and associated row and col value
            const yRanges = calculateRanges(normalizedSelection[shape.length - 2], heightPerImage, n);
            const xRanges = calculateRanges(normalizedSelection[shape.length - 1], widthPerImage, p);

            const dataSelections = yRanges.flatMap((yRange, row) => xRanges.map((xRange, col) => ({
              imageIndex: row * p + col,
              row,
              col,
              adjustedSelection: normalizedSelection.map((dimSelection, i) => {
                if (i === shape.length - 2) return yRange ? slice(yRange.start, yRange.stop, yRange.step) : null;
                if (i === shape.length - 1) return xRange ? slice(xRange.start, xRange.stop, xRange.step) : null;
                return dimSelection;
              }),
            }))).filter(({ adjustedSelection }) => !adjustedSelection.includes(null));

            const dataPerImage = await Promise.all(
              dataSelections.map(({
                imageIndex, adjustedSelection, row, col,
              }) => get(arrs[imageIndex], adjustedSelection).then((data) => ({
                data, row, col,
              }))),
            );

            return combineGridData(dataPerImage);
          }
        };
      }

      if (prop === 'dtype') {
        return getV2DataType(target.dtype);
      }

      if (prop === 'shape') {
        const shape = firstArray.shape.slice();
        shape[shape.length - 2] *= n;
        shape[shape.length - 1] *= p;
        return shape;
      }

      return Reflect.get(target, prop);
    },
  });
}

function calculateRanges(dimSelection, sizePerImage, imagesPerDimension) {
  const { start, stop, step } = dimSelection;

  return Array.from({ length: imagesPerDimension }, (_, i) => {
    const rangeStart = Math.max(0, start - i * sizePerImage);
    const rangeStop = Math.min(stop - i * sizePerImage, sizePerImage);

    return rangeStart < rangeStop ? { start: rangeStart, stop: rangeStop, step } : null;
  });
}

function combineGridData(dataArrays) {
  if (dataArrays.length === 1) {
    return dataArrays[0].data; // Directly return if only one image
  }

  // Identify the grid bounds
  const minRow = Math.min(...dataArrays.map(({ row }) => row));
  const maxRow = Math.max(...dataArrays.map(({ row }) => row));
  const minCol = Math.min(...dataArrays.map(({ col }) => col));
  const maxCol = Math.max(...dataArrays.map(({ col }) => col));

  // Calculate the row heights and column widths
  const rowHeights = Array(maxRow - minRow + 1).fill(0);
  const colWidths = Array(maxCol - minCol + 1).fill(0);

  dataArrays.forEach(({ data, row, col }) => {
    const [height, width] = data.shape;
    rowHeights[row - minRow] = Math.max(rowHeights[row - minRow], height);
    colWidths[col - minCol] = Math.max(colWidths[col - minCol], width);
  });

  // Compute total dimensions
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

  const combinedData = new Uint8Array(totalHeight * totalWidth);

  // Calculate offsets using row heights and column widths and place image data
  dataArrays.forEach(({ data, row, col }) => {
    const [height, width] = data.shape;

    // Calculate the offsets using reduce for row and column
    const offsetY = rowHeights.slice(0, row - minRow).reduce((sum, h) => sum + h, 0);
    const offsetX = colWidths.slice(0, col - minCol).reduce((sum, w) => sum + w, 0);

    // Loop through each pixel in the source image
    [...Array(height)].forEach((_, y) => [...Array(width)].forEach((_, x) => {
      const srcIndex = y * width + x;
      const destIndex = (offsetY + y) * totalWidth + (offsetX + x);
      combinedData[destIndex] = data.data[srcIndex];
    }));
  });

  return {
    data: combinedData,
    shape: [totalHeight, totalWidth],
    stride: [totalWidth, 1],
  };
}
