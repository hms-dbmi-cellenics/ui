import * as vega from 'vega';

import { union } from 'utils/cellSetOperations';

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

const colorByGeneExpression = (truncatedExpression, colorInterpolator, min, max = 4) => {
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
    // Skip cells with no embedding data (empty array)
    if (!value || !Array.isArray(value) || value.length !== 2) {
      return;
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
    const sampleId = sampleIds.find((id) => properties[id]?.cellIds?.has(key));
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

const offsetPolygons = (results, properties, sampleIds, perImageShape, gridShape) => {
  const [imageWidth, imageHeight] = perImageShape;
  const numColumns = gridShape[1];

  const sampleOffsets = sampleIds.map((sampleId, sampleIndex) => {
    const row = Math.floor(sampleIndex / numColumns);
    const column = sampleIndex % numColumns;
    return {
      xOffset: column * imageWidth,
      yOffset: row * imageHeight,
    };
  });

  const offsetResults = results.map((coords, key) => {
    if (!coords) return null;

    const sampleId = sampleIds.find((id) => properties[id]?.cellIds?.has(key));
    if (!sampleId) {
      throw new Error(`Sample ID not found for cell ID: ${key}`);
    }

    const sampleIndex = sampleIds.indexOf(sampleId);
    if (sampleIndex === -1) {
      throw new Error(`Sample ID ${sampleId} not found in sampleIds`);
    }

    const { xOffset, yOffset } = sampleOffsets[sampleIndex];

    // coords is flat [x1, y1, x2, y2, ...]; apply xOffset to even indices, yOffset to odd
    return coords.map((val, i) => (i % 2 === 0 ? val + xOffset : val + yOffset));
  });

  return offsetResults;
};

const filterPolygonsData = (results, colors, hiddenCells) => {
  const data = [];
  const obsSegmentationsIndex = [];
  const segmentationColors = new Map();

  results.forEach((coords, key) => {
    if (hiddenCells.has(key) || !coords) {
      return;
    }

    // Skip cells with no embedding data (empty array)
    if (!coords || !Array.isArray(coords) || coords.length === 0) {
      return;
    }

    if (coords.length < 2 || coords.length % 2 !== 0) {
      console.log(coords);
      throw new Error('Invalid polygon coordinates: expected flat array with even length');
    }

    // Convert flat [x1, y1, x2, y2, ...] to [[x1, y1], [x2, y2], ...] for vitessce
    const polygon = [];
    for (let i = 0; i < coords.length; i += 2) {
      polygon.push([coords[i], coords[i + 1]]);
    }

    data.push(polygon);
    segmentationColors.set(key.toString(), colors[key]);
    obsSegmentationsIndex.push(key.toString());
  });

  return {
    obsSegmentations: { data, shape: [data.length] },
    obsSegmentationsIndex,
    segmentationColors,
  };
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
  filterPolygonsData,
  updateStatus,
  clearPleaseWait,
  colorByGeneExpression,
  offsetCentroids,
  offsetPolygons,
  hexToRgb,
  convertRange,
};
