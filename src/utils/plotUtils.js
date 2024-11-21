import * as vega from 'vega';

import { union } from 'utils/cellSetOperations';

const colorInterpolator = vega.scheme('plasma');

const hexToRgb = (hex) => {
  if (hex) {
    const i = parseInt(hex.replace(/^#/, ''), 16);
    const r = (i >> 16) & 255;
    const g = (i >> 8) & 255;
    const b = i & 255;
    return [r, g, b];
  }
  return null;
};

const cssRgbToRgb = (rgb) => {
  if (rgb) {
    return rgb.match(/\d+/g).map(Number);
  }
  return null;
};

const renderCellSetColors = (rootKey, cellSetHierarchy, cellSetProperties) => {
  const colors = {};

  // First, find the key you are focusing on.
  const [node] = cellSetHierarchy.filter((rootNode) => rootNode.key === rootKey);

  if (!node?.children) {
    return {};
  }

  // Extract children of root key.
  const cellSets = node.children.map((child) => child.key);

  cellSets.forEach((key) => {
    if (!(key in cellSetProperties)) {
      return {};
    }

    const { color: stringColor, cellIds } = cellSetProperties[key];
    const color = hexToRgb(stringColor);

    if (color && cellIds) {
      cellIds.forEach((cellId) => {
        colors[cellId] = color;
      });
    }
  });

  return colors;
};

const colorByGeneExpression = (truncatedExpression, min, max = 4) => {
  // eslint-disable-next-line no-param-reassign
  if (max === 0) max = 4;

  const scaleFunction = vega.scale('sequential')()
    .domain([min, max])
    .interpolator(colorInterpolator);
  return Object.fromEntries(truncatedExpression.map(
    (expressionValue, cellId) => [cellId, cssRgbToRgb(scaleFunction(expressionValue))]
    ,
  ));
};

const filterCentroidsData = (results, colors, hiddenCentroids) => {
  // obsCentroidsIndex is the cell names
  // data keys are positions from 0 to length (no missing)
  // centroidColors is a map from cell name => color
  let dataKey = 0;
  const data = [{}, {}];
  const obsCentroidsIndex = [];
  const centroidColors = new Map();

  results.forEach((value, key) => {
    if (hiddenCentroids.has(key)) {
      return;
    }
    if (value.length !== 2) {
      throw new Error('Unexpected number of embedding dimensions');
    }

    const [x, y] = value;
    data[0][dataKey] = x;
    data[1][dataKey] = y;

    centroidColors.set(key.toString(), colors[key]);
    obsCentroidsIndex.push(key.toString());

    dataKey += 1;
  });

  return {
    obsCentroids: { data, shape: [data.length, obsCentroidsIndex.length] },
    obsCentroidsIndex,
    centroidColors,
  };
};

const convertCentroidsData = (results) => {
  const data = [{}, {}];
  const obsCentroidsIndex = [];

  results.forEach((value, key) => {
    if (value.length !== 2) {
      throw new Error('Unexpected number of embedding dimensions');
    }
    const [x, y] = value;
    data[0][key] = x;
    data[1][key] = y;

    obsCentroidsIndex.push(key.toString());
  });

  return {
    obsCentroids: { data, shape: [data.length, results.length] },
    obsCentroidsIndex,
  };
};

const convertCellsData = (results, hidden, properties) => {
  const data = [[], []];
  const obsEmbeddingIndex = [];

  const hiddenCells = union([...hidden], properties);
  results.forEach((value, key) => {
    if (hiddenCells.has(key)) {
      return;
    }
    if (value.length !== 2) {
      throw new Error('Unexpected number of embedding dimensions');
    }
    data[0].push(value[0]);
    data[1].push(value[1]);
    obsEmbeddingIndex.push(key.toString());
  });

  return {
    obsEmbedding: { data, shape: [data.length, results.length] },
    obsEmbeddingIndex,
  };
};

const offsetCentroids = (results, properties, sampleIds, perImageShape, gridShape) => {
  const [imageWidth, imageHeight] = perImageShape;
  const numColumns = gridShape[1];

  // Pre-calculate offsets for each sampleId
  const sampleOffsets = sampleIds.map((sampleId, sampleIndex) => {
    const row = Math.floor(sampleIndex / numColumns);
    const column = sampleIndex % numColumns;
    return {
      xOffset: column * imageWidth,
      yOffset: row * imageHeight,
    };
  });

  // Map the results with pre-calculated offsets
  const offsetResults = results.map(([x, y], key) => {
    // Determine which sample this cell belongs to
    const sampleId = sampleIds.find((id) => properties[id].cellIds.has(key));
    if (!sampleId) {
      throw new Error(`Sample ID not found for cell ID: ${key}`);
    }

    // Determine the index of the sample in the sampleIds array
    const sampleIndex = sampleIds.indexOf(sampleId);
    if (sampleIndex === -1) {
      throw new Error(`Sample ID ${sampleId} not found in sampleIds`);
    }

    // Retrieve pre-calculated offsets
    const { xOffset, yOffset } = sampleOffsets[sampleIndex];

    // Apply offsets
    return [x + xOffset, y + yOffset];
  });

  return offsetResults;
};

const updateStatus = () => { };
const clearPleaseWait = () => { };

const convertRange = (value, r1, r2) => {
  // prevent devision by zero
  if (r1[0] === r1[1]) return value;

  // eslint-disable-next-line no-mixed-operators
  return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
};

export {
  renderCellSetColors,
  convertCellsData,
  convertCentroidsData,
  filterCentroidsData,
  updateStatus,
  clearPleaseWait,
  colorByGeneExpression,
  colorInterpolator,
  offsetCentroids,
  hexToRgb,
  convertRange,
};
