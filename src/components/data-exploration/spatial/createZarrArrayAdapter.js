// from https://github.com/vitessce/vitessce/blob/main/packages/utils/zarr-utils/src/adapter.ts

import { slice, get } from 'zarrita';

// Light neutral canvas (#f5f7f9) used to fill the RGB image grid's empty cells
// (the "filler" tiles that complete the last row of a multi-sample grid).
const SPATIAL_BACKGROUND_COLOR = { 0: 245, 1: 247, 2: 249 };

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

// emptyFill controls the value written into empty grid cells (filler tiles that
// complete the last row). For the RGB image grid it's a per-channel object
// (SPATIAL_BACKGROUND_COLOR → #f5f7f9). For the segmentation label grid pass 0
// so the filler reads as background (excludeBackground makes it transparent,
// revealing the light image filler beneath) instead of a bogus cell id.
// slotToArrIndex maps each grid cell (row * numCols + col) to an index into
// `arrs`, or null for an empty filler cell. When omitted, cells are filled
// densely row-major (arrs[0], arrs[1], …) — the ungrouped default. A map lets
// samples be grouped into rows with filler cells mid-grid (see
// buildSpatialGridLayout).
export function createZarrArrayAdapterGrid(
  arrs, [numRows, numCols], emptyFill = SPATIAL_BACKGROUND_COLOR, slotToArrIndex = null,
) {
  const firstArray = arrs[0];

  return new Proxy(firstArray, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return async (selection) => {
          const { shape } = firstArray;
          const [heightPerImage, widthPerImage] = shape.slice(-2);

          if (selection) {
            // Normalize the selection, ensuring that any null
            // values for x or y axes default to a grid-wide range
            // Use provided selection unless it's nullish,
            // in which case calculate the grid spanning range
            const normalizedSelection = selection.map((s, i) => s ?? {
              start: 0,
              stop: (i === shape.length - 2
                ? heightPerImage * numRows // Full range for y-axis based on number of rows
                : widthPerImage * numCols), // Full range for x-axis based on number of columns
              step: 1,
            });

            // Calculate the y-axis (row-wise) and x-axis
            // (column-wise) slice ranges for each image in the grid
            const yRanges = calculateRanges(
              normalizedSelection[shape.length - 2],
              heightPerImage,
              numRows,
            );
            const xRanges = calculateRanges(
              normalizedSelection[shape.length - 1],
              widthPerImage,
              numCols,
            );

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

              const slot = row * numCols + col;
              // Resolve the grid cell to a backing image. With a slot map,
              // cells can be empty mid-grid (grouped rows); without one, cells
              // fill densely and are empty only past the sample count.
              const arrIndex = slotToArrIndex ? slotToArrIndex[slot] : slot;
              const hasImage = arrIndex !== null && arrIndex !== undefined
                && arrIndex < arrs.length;

              return {
                imageIndex: arrIndex,
                row,
                col,
                adjustedSelection,
                hasImage,
              };
            })).filter(Boolean); // Remove any null results

            // The requested region can fall entirely outside the grid — e.g. a
            // stale tile request after the grid shape shrank when the sample
            // grouping changed. Return a background tile of the requested size
            // rather than letting combineGridData build from an empty list.
            if (dataSelections.length === 0) {
              return generateEmptyImageData(normalizedSelection, 0, 0, emptyFill).data;
            }

            const dataPerImage = await Promise.all(
              dataSelections.map(({
                imageIndex, adjustedSelection, hasImage, row, col,
              }) => {
                if (hasImage) {
                  return get(
                    arrs[imageIndex],
                    adjustedSelection,
                  ).then((data) => ({ data, row, col }));
                }

                // Generate image data if the image doesn't exist
                return generateEmptyImageData(adjustedSelection, row, col, emptyFill);
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

function generateEmptyImageData(adjustedSelection, row, col, emptyFill = SPATIAL_BACKGROUND_COLOR) {
  // Extract the channel and slices for y and x dimensions
  const [channel, ySlice, xSlice] = adjustedSelection;

  // Calculate the dimensions for the empty image data. Clamp to >= 0: a stale
  // out-of-bounds tile request (e.g. right after the grid shape shrinks when the
  // sample grouping changes) can arrive with stop < start, which would make
  // `new Int32Array(negative)` throw "Invalid typed array length".
  const height = Math.max(0, ySlice.stop - ySlice.start);
  const width = Math.max(0, xSlice.stop - xSlice.start);

  // Fill value for the empty cell: a per-channel object (RGB image background)
  // or a scalar (e.g. 0 for the segmentation label grid).
  const backgroundChannelValue = typeof emptyFill === 'object'
    ? (emptyFill[channel] ?? 0)
    : emptyFill;
  const data = new Int32Array(height * width).fill(backgroundChannelValue);

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
  if (dataArrays.length === 0) {
    // No tiles intersect the request; nothing to composite. Return an empty
    // tile instead of computing a negative grid size (Array(-Infinity)).
    return { data: new Int32Array(0), shape: [0, 0], stride: [0, 1] };
  }

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
    rowHeights[row - minRow] = height;
    colWidths[col - minCol] = width;
  });

  // Compute total dimensions
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Uint8Array causes WebGL: INVALID_OPERATION:
  // texImage2D: type INT but ArrayBufferView not Int32Array
  const combinedData = new Int32Array(totalHeight * totalWidth);

  // Calculate offsets using row heights and column widths and place image data
  dataArrays.forEach(({ data, row, col }) => {
    const [height, width] = data.shape;

    const offsetY = rowHeights.slice(0, row - minRow).reduce((sum, h) => sum + h, 0);
    const offsetX = colWidths.slice(0, col - minCol).reduce((sum, w) => sum + w, 0);

    // Copy each line of the image data to the destination grid
    for (let y = 0; y < height; y += 1) {
      const srcIndexStart = y * width;
      const srcIndexEnd = srcIndexStart + width;
      const destIndexStart = (offsetY + y) * totalWidth + offsetX;

      // Copy the entire row at once
      combinedData.set(data.data.subarray(srcIndexStart, srcIndexEnd), destIndexStart);
    }
  });

  return {
    data: combinedData,
    shape: [totalHeight, totalWidth],
    stride: [totalWidth, 1],
  };
}
