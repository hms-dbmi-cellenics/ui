// from https://github.com/vitessce/vitessce/blob/main/packages/utils/zarr-utils/src/adapter.ts
// should be able to import { createZarrArrayAdapter } from '@vitessce/zarr-utils' but it doesn't work!

import { slice, get } from 'zarrita';

// use background color of tile for transparent data
const SPATIAL_BACKGROUND_COLOR = { 0: 246, 1: 247, 2: 249 };

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

export function createZarrArrayAdapterGrid(arrs, [numRows, numCols]) {
  const firstArray = arrs[0];

  return new Proxy(firstArray, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return async (selection) => {
          const { shape } = firstArray;
          const [heightPerImage, widthPerImage] = shape.slice(-2);

          if (selection) {
            // Normalize the selection, ensuring that any null values for x or y axes default to a grid-wide range
            // Use provided selection unless it's nullish, in which case calculate the grid spanning range
            const normalizedSelection = selection.map((s, i) => s ?? {
              start: 0,
              stop: (i === shape.length - 2
                ? heightPerImage * numRows // Full range for y-axis based on number of rows
                : widthPerImage * numCols), // Full range for x-axis based on number of columns
              step: 1,
            });

            // Calculate the y-axis (row-wise) and x-axis (column-wise) slice ranges for each image in the grid
            const yRanges = calculateRanges(normalizedSelection[shape.length - 2], heightPerImage, numRows);
            const xRanges = calculateRanges(normalizedSelection[shape.length - 1], widthPerImage, numCols);

            const dataSelections = yRanges.flatMap((yRange, row) => xRanges.map((xRange, col) => {
              if (!yRange || !xRange) return null; // Immediately filter out null ranges

              // Generate a list of data selections across the grid based on calculated ranges.
              const adjustedSelection = normalizedSelection.map((dimSelection, i) => {
                switch (i) {
                  case shape.length - 2:
                    return slice(yRange.start, yRange.stop, yRange.step);
                  case shape.length - 1:
                    return slice(xRange.start, xRange.stop, xRange.step);
                  default:
                    return dimSelection;
                }
              });

              const imageIndex = row * numCols + col;
              const hasImage = imageIndex < arrs.length;

              return {
                imageIndex,
                row,
                col,
                adjustedSelection,
                hasImage,
              };
            })).filter(Boolean); // Remove any null results

            const dataPerImage = await Promise.all(
              dataSelections.map(({
                imageIndex, adjustedSelection, hasImage, row, col,
              }) => {
                if (hasImage) {
                  return get(arrs[imageIndex], adjustedSelection).then((data) => ({ data, row, col }));
                }

                // Generate transparent image data if the image doesn't exist
                return generateTransparentData(adjustedSelection, row, col);
              }),
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
        shape[shape.length - 2] *= numRows;
        shape[shape.length - 1] *= numCols;
        return shape;
      }

      return Reflect.get(target, prop);
    },
  });
}

function generateTransparentData(adjustedSelection, row, col) {
  // Extract the relevant slices for y and x dimensions
  const [channel, ySlice, xSlice] = adjustedSelection;

  // Calculate the dimensions for the transparent data
  const height = ySlice.stop - ySlice.start;
  const width = xSlice.stop - xSlice.start;

  // Create transparent data (assumed 0 to be transparent)
  const data = new Uint8Array(height * width).fill(SPATIAL_BACKGROUND_COLOR[channel]);

  // Return an object structured like Zarr array data
  return {
    data: {
      data,
      shape: [height, width],
      stride: [width, 1],
    },
    row,
    col,
  };
}

function calculateRanges(dimSelection, sizePerImage, imagesPerDimension) {
  const { start, stop, step } = dimSelection;

  // Create an array corresponding to each image along the dimension
  return Array.from({ length: imagesPerDimension }, (_, i) => {
    // Calculate the starting point for this image's range, ensuring it isn't negative
    const rangeStart = Math.max(0, start - i * sizePerImage);

    // Calculate the ending point for this image's range, ensuring it doesn't exceed image size
    const rangeStop = Math.min(stop - i * sizePerImage, sizePerImage);

    // Check if this range is valid. If so, return it; otherwise, return null.
    return rangeStart < rangeStop ? { start: rangeStart, stop: rangeStop, step } : null;
  });
}

function combineGridData(dataArrays) {
  if (dataArrays.length === 1) {
    return dataArrays[0].data; // Directly return if only one image
  }

  // Identify the grid bounds
  const rows = dataArrays.map(({ row }) => row);
  const cols = dataArrays.map(({ col }) => col);
  const [minRow, maxRow] = [Math.min(...rows), Math.max(...rows)];
  const [minCol, maxCol] = [Math.min(...cols), Math.max(...cols)];

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
