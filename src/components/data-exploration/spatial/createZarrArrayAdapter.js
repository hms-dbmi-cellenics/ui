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
          if (selection) {
            const shape1 = arr1.shape;
            const width1 = shape1[shape1.length - 1];

            // Adjust the selection for the x-axis
            const adjustedSelections = selection.map((dimSelection, i) => {
              if (typeof dimSelection === 'object' && dimSelection !== null) {
                const axisLength = i === shape1.length - 1 ? width1 : shape1[i];
                const [start, stop, step] = [dimSelection.start, dimSelection.stop, dimSelection.step];

                if (i === shape1.length - 1) { // If it's the x-axis
                  const firstImageSelection = slice(start < width1 ? start : 0, Math.min(stop, width1), step);
                  const secondImageSelection = slice(Math.max(0, start - width1), Math.max(0, stop - width1), step);
                  return [firstImageSelection, secondImageSelection];
                }

                return [slice(start, stop, step), slice(start, stop, step)];
              }
              return [dimSelection, dimSelection];
            });

            const data1Selection = adjustedSelections.map(([s1, _s2]) => s1);
            const data2Selection = adjustedSelections.map(([_s1, s2]) => s2);

            console.log('data1Selection!!!!');
            console.log(data1Selection);
            console.log(data2Selection);

            const data1 = await get(arr1, data1Selection);
            const data2 = await get(arr2, data2Selection);

            // Combine the data
            const combinedData = combineSideBySide(data1, data2);

            return combinedData;
          }
          // Default selection to full extents if falsy
          const s1 = arr1.shape.map(() => null);
          const s2 = arr2.shape.map(() => null);

          // get the data for each image
          const data1 = await get(arr1, s1);
          const data2 = await get(arr2, s2);

          // Combine the data
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
      return Reflect.get(target, prop);
    },
  });
}
function combineSideBySide(data1, data2) {
  console.log('data1!!!!');
  console.log(data1);
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
