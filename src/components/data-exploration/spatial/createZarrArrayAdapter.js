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

export function createZarrArrayAdapterDual(arrs) {
  const [arr1, arr2] = arrs;

  return new Proxy(arr1, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return async (selection) => {
          let data1;
          let data2;

          if (selection) {
            const shape1 = arr1.shape;
            const width1 = shape1[shape1.length - 1];

            // Adjust the selection for the x-axis
            const adjustedSelections = selection.map((dimSelection, i) => {
              if (typeof dimSelection === 'object' && dimSelection !== null) {
                const [start, stop, step] = [dimSelection.start, dimSelection.stop, dimSelection.step];

                if (i === shape1.length - 1) { // If it's the x-axis
                  const firstImageStart = Math.max(0, Math.min(start, width1));
                  const firstImageStop = Math.max(firstImageStart, Math.min(stop, width1));
                  const secondImageStart = Math.max(0, start - width1);
                  const secondImageStop = Math.max(secondImageStart, stop - width1);

                  const firstImageSelection = slice(firstImageStart, firstImageStop, step);
                  const secondImageSelection = slice(secondImageStart, secondImageStop, step);

                  return [firstImageSelection, secondImageSelection];
                }

                return [slice(start, stop, step), slice(start, stop, step)];
              }
              return [dimSelection, dimSelection];
            });

            const data1Selection = adjustedSelections.map(([s1, _]) => s1);
            const data2Selection = adjustedSelections.map(([_, s2]) => s2);

            // Check if one of the selections is effectively empty
            const isData1Empty = data1Selection.some((s) => s !== null && typeof s === 'object' && s.start === s.stop);
            const isData2Empty = data2Selection.some((s) => s !== null && typeof s === 'object' && s.start === s.stop);

            if (!isData1Empty) {
              data1 = await get(arr1, data1Selection);
            }
            if (!isData2Empty) {
              data2 = await get(arr2, data2Selection);
            }

            // Return from the non-empty data
            if (isData1Empty) return data2;
            if (isData2Empty) return data1;

            // Combine the data if both parts are valid
            const combinedData = combineSideBySide(data1, data2);

            return combinedData;
          }

          // Default selection to full extents if falsy
          const s1 = arr1.shape.map(() => null);
          const s2 = arr2.shape.map(() => null);

          data1 = await get(arr1, s1);
          data2 = await get(arr2, s2);

          const combinedData = combineSideBySide(data1, data2);
          return combinedData;
        };
      }
      if (prop === 'getRawChunk') {
        throw new Error('getRawChunk should not have been called');
      }
      if (prop === 'dtype') {
        return getV2DataType(target.dtype);
      }
      if (prop === 'shape') {
        // Calculate combined shape
        const shape1 = arr1.shape;
        const shape2 = arr2.shape;
        const combinedShape = [...shape1];
        combinedShape[combinedShape.length - 1] += shape2[shape2.length - 1];
        return combinedShape;
      }
      return Reflect.get(target, prop);
    },
  });
}
function combineSideBySide(data1, data2) {
  const shape1 = data1.shape;
  const shape2 = data2.shape;

  const height = shape1[0]; // Number of rows, assuming shape = [height, width]
  const width1 = shape1[1]; // Width of the first image
  const width2 = shape2[1]; // Width of the second image

  // New combined shape and stride
  const newShape = [height, width1 + width2];
  const newStride = [width1 + width2, 1];

  // Prepare new data container
  const combinedData = new Uint8Array(newShape[0] * newShape[1]);

  // Iteratively combine data from both arrays
  for (let i = 0; i < height; i++) {
    // Calculate indices for each row
    const rowStart1 = i * width1;
    const rowStart2 = i * width2;
    const combinedRowStart = i * newStride[0];

    // Copy data for row i from data1
    combinedData.set(data1.data.subarray(rowStart1, rowStart1 + width1), combinedRowStart);

    // Copy data for row i from data2
    combinedData.set(data2.data.subarray(rowStart2, rowStart2 + width2), combinedRowStart + width1);
  }

  return {
    data: combinedData,
    shape: newShape,
    stride: newStride,
  };
}

export function createZarrArrayAdapterGrid(arrs, [n, p]) {
  const firstArray = arrs[0];

  return new Proxy(firstArray, {
    get(target, prop) {
      if (prop === 'getRaw') {
        return async (selection) => {
          const { shape } = firstArray;
          const heightPerImage = shape[shape.length - 2];
          const widthPerImage = shape[shape.length - 1];

          if (selection) {
            console.log('selection!!!');
            console.log(selection);
            // Account for full range in any dimension marked by null
            const gridSelection = [
              selection[0],
              { start: 0, stop: heightPerImage * n, step: 1 },
              { start: 0, stop: widthPerImage * p, step: 1 },
            ];

            const normalizedSelection = selection.map((s, i) => (
              s === null ? gridSelection[i] : s
            ));

            // get x and y ranges and associated row and col value
            console.log('normalizedSelection!!!');
            console.log(normalizedSelection);
            const yRanges = calculateRanges(normalizedSelection[shape.length - 2], heightPerImage, n);
            const xRanges = calculateRanges(normalizedSelection[shape.length - 1], widthPerImage, p);

            console.log('ranges!!!!');
            console.log(yRanges);
            console.log(xRanges);

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

            console.log('dataSelections!!!!');
            console.log(dataSelections);

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

  // Calculate offsets based on row heights and column widths
  dataArrays.forEach(({ data, row, col }) => {
    const [height, width] = data.shape;

    const offsetY = rowHeights.slice(0, row - minRow).reduce((sum, h) => sum + h, 0);
    const offsetX = colWidths.slice(0, col - minCol).reduce((sum, w) => sum + w, 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const destIndex = (offsetY + y) * totalWidth + (offsetX + x);
        combinedData[destIndex] = data.data[srcIndex];
      }
    }
  });

  return {
    data: combinedData,
    shape: [totalHeight, totalWidth],
    stride: [totalWidth, 1],
  };
}
